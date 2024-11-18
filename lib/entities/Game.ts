import { RevealCardResponse } from '../server/dto/RevealCard.js'
import GenerateCardsService from '../services/GenerateCardsService.js'
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
        teamOne: new Team('teamOne', 'Blue', '#0bf', true),
        teamTwo: new Team('teamTwo', 'Red', '#f22', true),
        bystander: new Team('bystander', 'Bystander', '#edcb40', false),
        assassin: new Team('assassin', 'Assassin', '#2c3e50', false),
      }
    }
    this.teams.teamOne.qty = this.config.numTeamCards;
    this.teams.teamTwo.qty = this.config.numTeamCards;
    this.teams.assassin.qty = this.config.numAssassins;
    this.teams.bystander.qty = (this.config.numCardsSqrt ** 2) - this.teams.teamOne.qty - this.teams.teamTwo.qty - this.teams.assassin.qty;
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
        game.cards = new GenerateCardsService().generateCards(Object.values(game.teams));
        game.state = GameStates.turnPrep;
        game.teamOfTurn = game.teams.teamOne;
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
        const card = game.getCardById(cardId)
        if (!game.state.canRevealCard) return
        const cardTeam = game.getCardTeam(card)!;
        const cardBelongsToTeamOfTurn = cardTeam.id === game.teamOfTurn!.id

        card.revealTeam()
        cardTeam.pts++
        game.numMatchesFound++

        console.log('\nFlipped card!')
        console.log('teamOfTurn:', game.teamOfTurn!.id)
        console.log('cardTeam:', cardTeam.id)
        console.log('cardTeam pts:', cardTeam.pts)
        console.log('cardTeam qty:', cardTeam.qty)

        if (cardTeam.pts === cardTeam.qty) {
          game.winner = cardTeam;
          game.winningCard = card;
          game.state = GameStates.gameOver;
        } else if (!cardBelongsToTeamOfTurn || game.numMatchesFound > game.numHintMatches) {
          game.actions.advanceTurn();
        }

        return new RevealCardResponse(card, cardBelongsToTeamOfTurn, game)
      },

      advanceTurn() {
        if (!game.state.canRevealCard) return;
        if (!game.teamOfTurn) game.teamOfTurn = game.teams.teamOne;
        else {
          game.teamOfTurn = game.teamOfTurn.id === game.teams.teamOne.id ? game.teams.teamTwo : game.teams.teamOne;
        }
        game.numMatchesFound = 0;
        game.state = GameStates.turnPrep;
      },

      resetGame() {
        for (const team of Object.values(game.teams)) {
          team.pts = 0
        }
        game.cards = [];
        game.teamOfTurn = null
        game.winner = null
        game.winningCard = null
        game.numMatchesFound = 0
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
    const team = Array.from(Object.values(this.teams)).find((t) => t.id == card.teamId)
    return team
  }

  getCardById(id) {
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
