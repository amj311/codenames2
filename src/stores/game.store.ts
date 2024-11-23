import { defineStore } from 'pinia';
import { PING_INTERVAL } from '../../lib/constants';
import { getCaptainsTeam } from "../../lib/services/GameHelpers"
import api from '@/services/api';
import { useAppStore } from './app.store';

export const useGameStore = defineStore('game', {
	state: () => ({
		savedState: null,
		gameRoomId: null as string | null,
		user: {
			id: '',
			username: '',
			isHost: false,
			isPlayer: false,
		},
		gameState: null as any,
		roomState: null as any,
		pingTimeout: null as any,
		lastSuccessfulAction: Date.now(),
		pingError: null as any,
		hasSentSubscription: false,
	}),
	actions: {
		async newGame() {
			this.clear();
			const { data } = await api.post('/room/new');
			this.upsertJoinedGame({ gameRoomId: data.rid, userId: data.hostUser.id });
			return data.rid;
		},

		async connectToRoom(rid: string) {
			const returningUserId = this.getJoinedGame(rid)?.userId;
			const { data } = await api.post('/room/' + rid + '/connect', {
				returningUserId,
			});
			this.clear();
			this.gameRoomId = rid;
			this.upsertJoinedGame({ gameRoomId: rid, userId: data.user.id });
			this.setUser(data.user);
			this.setGameState(data.game);
			this.setRoomState(data.room);
			this.initPings();
		},

		setGameState(state) {
			this.gameState = state;
		},
		setRoomState(state) {
			this.roomState = state;
		},
		setUser(user) {
			this.user = user;
		},

		initPings() {
			clearTimeout(this.pingTimeout);
			this.doPing();
		},
		async doPing() {
			try {
				const subscription = await useAppStore().getSwSubscription();
				let subscriptionToSend;
				if (subscription && !this.hasSentSubscription) {
					subscriptionToSend = subscription;
				}
				await this.doRoomAction('pingUser', {
					isActiveTab: !document.hidden,
					pushSubscription: subscriptionToSend,
				});
				if (subscriptionToSend) {
					this.hasSentSubscription = true;
				}
				this.schedulePing();
			}
			catch (err) {
				console.error(err);
				this.handlePingError(err);
			}
		},
		schedulePing() {
			this.pingTimeout = setTimeout(this.doPing, PING_INTERVAL);
		},
		handlePingError(error) {
			this.pingError = error;
		},

		getUserById(userId) {
			return this.roomState.users.find((user) => user.id === userId);
		},

		async doAction(type: 'game' | 'room', action, data?) {
			try {
				const { data: resData } = await api.post('/room/' + this.gameRoomId + `/${type}-action/` + action, {
					userId: this.user.id,
					data,
				});
				if (!resData.success) {
					throw new Error(`Unsuccessful ${type} action`);
				}
				this.setGameState(resData.game);
				this.setRoomState(resData.room);
				this.setUser(resData.user);
				this.lastSuccessfulAction = Date.now();
				this.pingError = null;
				return resData.actionRes;
			}
			catch (err) {
				this.handlePingError(err);
			}
		},

		async doGameAction(action, data?) {
			await this.doAction('game', action, data);
		},
		async doRoomAction(action, data?) {
			await this.doAction('room', action, data);
		},

		getJoinedGames() {
			return JSON.parse(localStorage.getItem('joinedGames') || '{}');
		},
		getJoinedGame(rid) {
			return this.getJoinedGames()[rid];
		},
		upsertJoinedGame({ gameRoomId, userId }) {
			const joinedGames = this.getJoinedGames();
			joinedGames[gameRoomId] = {
				gameRoomId: gameRoomId,
				userId: userId,
			};
			localStorage.setItem('joinedGames', JSON.stringify(joinedGames));
		},
		deleteJoinedGame(gameRoomId) {
			const joinedGames = this.getJoinedGames();
			delete joinedGames[gameRoomId];
			localStorage.setItem('joinedGames', JSON.stringify(joinedGames));
		},
		async leaveGameRoom(rid) {
			await this.doRoomAction('removePlayer', { userId: this.user.id });
			this.clear();
			this.deleteJoinedGame(rid);
		},
		clear() {
			this.gameRoomId = null;
			this.setUser(null);
			this.setGameState(null);
			this.setRoomState(null);
			clearInterval(this.pingTimeout);
			this.pingTimeout = null;
			this.lastSuccessfulAction = Date.now();
			this.pingError = null;
		},
	},
	getters: {
		isHost(state) {
			return state.user && state.roomState && state.user.id === state.roomState.hostUserId;
		},
		userCaptainOfTeam(state) {
			return getCaptainsTeam(state.user, state.gameState.teams);
		},
		teamOfTurn(state) {
			return state.gameState.teams[this.gameState.currentTurn?.teamId || ''];
		},
		score(state) {
			return computeGamePoints(state.gameState);
		}
	}
})

const seconds = (n) => n * 1000;
const timeBonus = (time, threshold, bonus) => {
	const thresholdRemaining = threshold - time;
	return Math.round(Math.max(0, thresholdRemaining / threshold) * bonus);
};
export function computeTurnPoints(turn, cards) {
	const TEAM_CARD_POINTS = 100;
	const HINT_TIME_BONUS_POINTS = 50;
	const HINT_TIME_THRESHOLD = seconds(30);
	const GUESSING_TIME_BONUS_POINTS = 50;
	const GUESSING_TIME_THRESHOLD = seconds(60);

	const hintTime = turn.hintGivenTime ? turn.hintGivenTime - turn.turnStartTime : Infinity;
	const guessingTime = (turn.turnEndTime && turn.hintGivenTime) ? turn.turnEndTime - turn.hintGivenTime : Infinity;

	const numTeamCards = cards.filter(
		(c) => c.suiteId === turn.teamId && turn.revealedCardIds.includes(c.id)
	).length;
	const comboMultiplier = numTeamCards;

	const breakdown = {
		hintTime,
		guessingTime,
		hintTimeBonus: timeBonus(hintTime, HINT_TIME_THRESHOLD, HINT_TIME_BONUS_POINTS),
		guessingTimeBonus: timeBonus(
			guessingTime,
			GUESSING_TIME_THRESHOLD,
			GUESSING_TIME_BONUS_POINTS
		),
		numTeamCards,
		teamCardPoints: TEAM_CARD_POINTS * numTeamCards,
		comboMultiplier,
	};

	// award 0 points for no team cards
	const subTotal =
		numTeamCards === 0
			? 0
			: breakdown.teamCardPoints + breakdown.hintTimeBonus + breakdown.guessingTimeBonus;
	const total = subTotal * comboMultiplier;

	return {
		...breakdown,
		subTotal,
		total,
	};
}

export function computeGamePoints(game) {
	// Balance here: because the number of cards can vary,
	// Don't allow high scores for completely omitting OR overwhelming one type of card
	const UNFLIPPED_OPPONENT_CARD_POINTS = 50;
	const turns = game.turnHistory;

	const turnBreakdowns = turns.map((turn) => computeTurnPoints(turn, game.cards));
	const totalTurnPoints = turnBreakdowns.reduce((a, b) => a + b.total, 0);

	// assumes there is only one team when playing High Scores
	const teamId = Object.keys(game.teams)[0];
	const opponentCards = !teamId ? [] : game.cards.filter((c) => c.suiteId !== teamId);
	const numOpponentCards = opponentCards.length;
	const unflippedOpponentCards = opponentCards.filter((c) => !c.flipped).length;

	const breakdown = {
		turnBreakdowns,
		totalTurnPoints,
		numOpponentCards,
		unflippedOpponentCards,
		unflippedOpponentCardPoints: UNFLIPPED_OPPONENT_CARD_POINTS * unflippedOpponentCards,
	};

	const total = totalTurnPoints + breakdown.unflippedOpponentCardPoints;

	// stars is not tied to high score. It is just a measurement of completion and accuracy
	const stars =
		turns.length === 0 ? 0 : Math.min(3, Math.floor(game.config.numTeamCards / turns.length));

	return {
		...breakdown,
		total,
		stars,
	};
}

