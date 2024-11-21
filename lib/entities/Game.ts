import { AI_CODEMASTER, CardSuites } from '../constants.js';
import GameRoom from '../server/GameRoom.js';
import { AiService } from '../services/AiService.js';
import GenerateCardsService from '../services/GenerateCardsService.js'
import Card from './Card.js';
import { GameStates } from './GameStates.js'
import Team from './Team.js'


const defaultConfig = {
	mode: 'classic',
	wordDeck: 'Easy',
	numCardsSqrt: 5,
	numTeams: 2,
	numTeamCards: 9,
	numAssassins: 1,
	numBystanders: 6,
};

export default class Game {
	public room!: GameRoom;
	public config = defaultConfig;
	public state = GameStates.waitingToStart;
	public teams!: Record<string, Team>;
	public cards: Card[] = [];

	public teamOfTurn: Team | null = null;
	public hintOfTurn = '';
	public numHintMatches: 0;
	public numMatchesFound: number = 0;
	public turnCount = 0;
	public winner: Team | null = null;
	public winningCard: Card | null = null;

	public aiHintFailure = false;
	public aiHintLog = [] as {
		hint: string,
		matchingWords: string[],
		explanation: string
		teamId: string
	}[];

	private usingCustomWords = '';
	private aiHintCount = 0;

	constructor(room: GameRoom) {
		this.room = room;
		this.configure();
	}

	public getSummary() {
		return {
			config: this.config,
			state: this.state,
			teams: this.teams,
			cards: this.cards,
			teamOfTurn: this.teamOfTurn,
			winner: this.winner,
			winningCard: this.winningCard,
			numMatchesFound: this.numMatchesFound,
			hintOfTurn: this.hintOfTurn,
			numHintMatches: this.numHintMatches,
			turnCount: this.turnCount,
			aiHintFailure: this.aiHintFailure,
			aiHintLog: this.aiHintLog,
		}
	}

	private configure(config = null) {
		this.config = this.sanitizeConfig(config || defaultConfig);
		this.configureTeams();
	}

	private sanitizeConfig(config) {
		config.numCardsSqrt = parseInt(config.numCardsSqrt)
		config.numTeams = parseInt(config.numTeams)
		config.numTeamCards = parseInt(config.numTeamCards)
		config.numAssassins = parseInt(config.numAssassins)
		config.numBystanders = parseInt(config.numBystanders)
		return config;
	}

	private configureTeams() {
		if (!this.teams) {
			this.teams = {
				teamOne: new Team('teamOne', 'Blue', '#0bf'),
			}
		}
		if (this.config.mode === 'high score') {
			delete this.teams.teamTwo;
			this.config.numTeams = 1;
		}
		else if (!this.teams.teamTwo) {
			this.teams.teamTwo = new Team('teamTwo', 'Red', '#f22');
			this.config.numTeams = 2;
		}
	}

	public get actions() {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const game = this;
		return {
			configure(userId, { config, customWords }) {
				game.configure(config);
				game.usingCustomWords = customWords;
			},

			makeUserCaptain(_, { teamCode, userId }) {
				game.teams[teamCode].captainId = userId;
			},
			removeTeamCaptain(_, { teamCode }) {
				game.teams[teamCode].captainId = null;
			},

			startGame() {
				if (!game.state.canStartGame) {
					console.log('Cannot start game from this state!')
					return
				}
				game.configureTeams();
				game.cards = new GenerateCardsService().generateCards(
					game.teams,
					game.config,
					game.usingCustomWords
				);
				let firstTeamId = game.teams.teamOne.id;
				if (game.config.numTeams > 1) {
					firstTeamId = Math.random() > (1 / game.config.numTeams) ? game.teams.teamTwo.id : game.teams.teamOne.id;
				}
				game.enterTeamTurnPrep(firstTeamId);
			},

			// endGame() {
			// 	if (!game.state.canEndGame) return;
			// 	game.state = GameStates.gameOver;
			// },

			exitGame() {
				if (!game.state.canEndGame) return;
				game.actions.resetGame();
			},

			startGuessing(_, { hint, numHintMatches }) {
				game.state = GameStates.guessing;
				game.numMatchesFound = 0;
				game.hintOfTurn = hint;
				game.numHintMatches = numHintMatches;

				// notify players other than the current captain
				const teamOfTurn = game.teams[game.teamOfTurn!.id];
				const users = Array.from(game.room.users.values()).filter(user => user.id !== teamOfTurn.captainId);
				game.room.gameInterface.notifyBatch(users.map(({ id }) => ({ userId: id, notification: { title: 'The next hint is ready!' } })));
			},

			revealCard(_, { cardId }) {
				game.revealCard(cardId);
			},

			retryAiHint() {
				game.attemptAiHint();
			},

			async advanceTurn() {
				let nextTeamId = game.teams.teamOne.id;
				if (game.config.mode === 'classic') {
					nextTeamId = game.teamOfTurn!.id === game.teams.teamOne.id ? game.teams.teamTwo.id : game.teams.teamOne.id;
				}
				game.enterTeamTurnPrep(nextTeamId);
			},

			resetGame() {
				game.cards = [];
				game.teamOfTurn = null;
				game.winner = null;
				game.winningCard = null;
				game.numMatchesFound = 0;
				game.hintOfTurn = '';
				game.numHintMatches = 0;
				game.turnCount = 0;
				game.aiHintFailure = false;
				game.aiHintCount = 0;
				game.aiHintLog = [];
				game.state = GameStates.waitingToStart;
			}
		}
	}

	async enterTeamTurnPrep(teamId: string) {
		const previousHint = this.hintOfTurn;
		this.teamOfTurn = this.teams[teamId];
		this.numMatchesFound = 0;
		this.turnCount++;
		this.hintOfTurn = '';
		this.numHintMatches = 0;
		this.state = GameStates.turnPrep;

		if (this.teamOfTurn.captainId === AI_CODEMASTER) {
			// allow this to complete asynchronously
			this.attemptAiHint(previousHint);
		}
		else {
			// alert captain to give hint
			const captainId = this.teamOfTurn.captainId;
			await this.room.gameInterface.notifyUser(captainId, { title: 'Time to give your team a hint!' });
		}

		return;
	}


	revealCard(cardId) {
		const card = this.getCardById(cardId);
		if (!this.state.canRevealCard) return;

		const cardTeam = this.getCardTeam(card);
		const cardSuite = CardSuites[card.suiteId];
		const cardBelongsToTeamOfTurn = cardSuite.id === this.teamOfTurn!.id;

		card.revealTeam();
		this.numMatchesFound++;

		// other team wins if assassin!
		if (cardSuite.id === 'assassin') {
			let winner;
			if (this.config.mode === 'classic') {
				winner = this.teamOfTurn!.id === this.teams.teamOne.id ? this.teams.teamTwo : this.teams.teamOne;
			}
			this.setEndGame(card, winner);
		}

		// bystander ends turn
		else if (cardSuite.id === 'bystander') {
			this.actions.advanceTurn();
		}

		else if (cardTeam) {
			const remainingCards = this.cards.filter((c) => c.suiteId === cardTeam.id && !c.revealed).length;
			// card team wins if they have no more cards
			if (remainingCards === 0) {
				this.setEndGame(card, cardTeam);
			}

			// next turn
			else if (!cardBelongsToTeamOfTurn || this.numMatchesFound > this.numHintMatches) {
				this.actions.advanceTurn();
			}
		}
	}

	setEndGame(card, winningTeam) {
		this.winner = winningTeam;
		this.winningCard = card;
		this.state = GameStates.gameOver;
		// notify players
		this.room.gameInterface.notifyAll({ title: 'The game is over!', body: 'Come see how it ended' });
	}

	// setTeamCaptain(setAsCaptain, teamCode, user) {
	//     if (!setAsCaptain || !teamCode) {
	//         if (this.teams.teamOne.captainId == user.id) this.teams.teamOne.captain = null
	//         if (this.teams.teamTwo.captainId == user.id) this.teams.teamTwo.captain = null
	//     } else {
	//         this.setTeamCaptain(false, null, user)
	//         if (this.teams[teamCode]);
	//         this.teams[teamCode].captain = user
	//     }
	//     return this
	// }

	getCardTeam(card) {
		const team = Array.from(Object.values(this.teams)).find((t) => t.id == card.suiteId)
		return team
	}

	getCardById(id): Card {
		return this.cards.find((c) => c.id == id)!
	}

	removePlayer(userId) {
		for (const team of Object.values(this.teams)) {
			if (team.captainId == userId) {
				team.captainId = null
			}
		}
	}

	canContinueAiHint(originalTeamId, originalTurnCount, originaliHintCount) {
		if (this.teamOfTurn?.id !== originalTeamId) return false;
		if (!this.state.isInPlay) return false;
		if (this.teamOfTurn?.captainId !== AI_CODEMASTER) return false;
		if (this.turnCount !== originalTurnCount) return false;
		if (this.aiHintCount !== originaliHintCount) return false;
		return true;
	}

	async attemptAiHint(previousHint?: string) {
		this.aiHintFailure = false;
		this.aiHintCount++;
		const originalTeamId = this.teamOfTurn?.id;
		const originalTurnCount = this.turnCount;
		const originalAiHintCount = this.aiHintCount;
		if (!this.canContinueAiHint(originalTeamId, originalTurnCount, originalAiHintCount)) return;
		try {
			const { success, response: hint } = await this.getHintFromAi(originalTeamId, previousHint);
			if (!this.canContinueAiHint(originalTeamId, originalTurnCount, originalAiHintCount)) return;
			if (!success) {
				this.aiHintFailure = true;
				return;
			};
			// Sometimes the AI disagrees with itself. In that case just send it as one match
			const numMatches = Math.max(hint.matchingWords.length, 1);
			this.actions.startGuessing(null, { hint: hint.hint, numHintMatches: numMatches });
			this.aiHintLog.push({
				hint: hint.hint,
				matchingWords: hint.matchingWords,
				explanation: hint.explanation,
				teamId: originalTeamId,
			})
		}
		catch (e) {
			console.error("Error getting AI hint");
			console.log(e);
		}
	}

	async getHintFromAi(forTeamId: string, previousHint?: string, cntAttempts = 0) {
		if (!this.teamOfTurn || !this.state.isInPlay) return { success: false, aborted: true };

		const { teamWords, opposingWords } = this.cards.reduce(
			(res, c) => {
				// We only need to consider cards which have not yet been flipped
				// This allows greater flexibility as the game progresses
				if (!c.revealed) {
					if (c.suiteId === forTeamId) {
						res.teamWords.push(c.word);
					}
					else {
						res.opposingWords.push(c.word);
					}
				}
				return res;
			},
			{ teamWords: [] as string[], opposingWords: [] as string[] },
		);

		const { success, response } = await AiService.getHint(teamWords, opposingWords, previousHint);
		if (!success && cntAttempts < 2) {
			return await this.getHintFromAi(forTeamId, previousHint, cntAttempts + 1);
		};
		return {
			success, response
		};
	}
}
