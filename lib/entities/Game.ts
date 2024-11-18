import { CardSuites } from '../constants.js';
import { RevealCardResponse } from '../server/dto/RevealCard.js'
import GenerateCardsService from '../services/GenerateCardsService.js'
import Card from './Card.js';
import { GameStates } from './GameStates.js'
import Team from './Team.js'

const defaultConfig = {
  numCardsSqrt: 5,
  numTeams: 2,
  numTeamCards: 9,
  numAssassins: 1,
  numBystanders: 6,
};

export default class Game {
  public config = defaultConfig;
  public state = GameStates.waitingToStart;
  public teams!: Record<string, Team>;
  public cards: any[] = [];
  public teamOfTurn: Team | null = null;
  public winner: Team | null = null;
  public winningCard: any = null;
  public numMatchesFound: number = 0;
  public hintOfTurn = '';
  public numHintMatches: 0;

  constructor(config = null) {
    this.configure(config);
  }

  private configure(config) {
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
        teamTwo: new Team('teamTwo', 'Red', '#f22'),
      }
    }
  }

  public get actions() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const game = this;
    return {
      configure(userId, config) {
        game.configure(config);
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
        );
        game.state = GameStates.turnPrep;
        game.teamOfTurn = Math.random() > 0.5 ? game.teams.teamTwo : game.teams.teamOne;
      },

      endGame() {
        if (!game.state.canEndGame) return;
        game.state = GameStates.gameOver;
      },

      exitGame() {
        if (!game.state.canEndGame) return;
        game.actions.resetGame();
      },

      startTurn(_, { hint, numHintMatches }) {
        game.state = GameStates.guessing;
        game.numMatchesFound = 0;
        game.hintOfTurn = hint;
        game.numHintMatches = numHintMatches;
      },

      revealCard(_, { cardId }) {
        const card = game.getCardById(cardId);
        if (!game.state.canRevealCard) return;

        const cardTeam = game.getCardTeam(card);
        const cardSuite = CardSuites[card.suiteId];
        const cardBelongsToTeamOfTurn = cardSuite.id === game.teamOfTurn!.id;

        card.revealTeam();
        game.numMatchesFound++;

        console.log('\nFlipped card!')
        console.log('teamOfTurn:', game.teamOfTurn!.id)
        console.log('cardTeam:', cardTeam?.id)
        console.log('cardSuite:', cardSuite.id)

        // other team wins if assassin!
        if (cardSuite.id === 'assassin') {
          console.log('assassin found!', cardSuite)
          game.winner = game.teamOfTurn!.id === game.teams.teamOne.id ? game.teams.teamTwo : game.teams.teamOne;
          game.winningCard = card;
          game.state = GameStates.gameOver;
        }

        // bystander ends turn
        else if (cardSuite.id === 'bystander') {
          game.actions.advanceTurn();
        }

        else if (cardTeam) {
          const remainingCards = game.cards.filter((c) => c.suiteId === cardTeam.id && !c.revealed).length;
          // card team wins if they have no more cards
          if (remainingCards === 0) {
            game.winner = cardTeam;
            game.winningCard = card;
            game.state = GameStates.gameOver;
          }

          // next turn
          else if (!cardBelongsToTeamOfTurn || game.numMatchesFound > game.numHintMatches) {
            game.actions.advanceTurn();
          }
        }

        return new RevealCardResponse(card, cardBelongsToTeamOfTurn, game)
      },

      advanceTurn() {
        game.teamOfTurn = game.teamOfTurn!.id === game.teams.teamOne.id ? game.teams.teamTwo : game.teams.teamOne;
        game.numMatchesFound = 0;
        game.state = GameStates.turnPrep;
      },

      resetGame() {
        for (const team of Object.values(game.teams)) {
          team.pts = 0;
        }
        game.cards = [];
        game.teamOfTurn = null;
        game.winner = null;
        game.winningCard = null;
        game.numMatchesFound = 0;
        game.state = GameStates.waitingToStart;
      }
    }
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
    return this.cards.find((c) => c.id == id)
  }

  removePlayer(userId) {
    for (const team of Object.values(this.teams)) {
      if (team.captainId == userId) {
        team.captainId = null
      }
    }
  }
}
