class GameState {
  constructor(props) {
    this.isInPlay = props.isInPlay || false // determines whether or not to show the waiting screen or the playing screen
    this.canStartGame = props.canStartGame || false // determines whether or not the game can move from waiting to playing
    this.canAddCodeMaster = props.canAddCodeMaster || false // determines whether or not new codemasters can be added
    this.canRevealCard = props.canRevealCard || false // whether or not any cards may be flipped
    this.canAdvanceTurn = props.canAdvanceTurn || false // whether or not the codemaster can end their turn
    this.canEndGame = props.canEndGame || false // whether or not the game can move from playing to waiting
    this.isGameOver = props.isGameOver || false // if the game has ended but is still in playing view.
  }
}

export const waitingToStart = new GameState({
  isInPlay: false,
  canStartGame: true,
  canAddCodeMaster: true,
  canEndGame: false,
})

export const guessing = new GameState({
  isInPlay: true,
  canRevealCard: true,
  canAdvanceTurn: true,
  canEndGame: true,
})

export const gameOver = new GameState({
  isGameOver: true,
  isInPlay: true,
  canEndGame: true,
})

export const missingCaptain = new GameState({
  isInPlay: true,
  canEndGame: true,
  canAddCodeMaster: true,
})
