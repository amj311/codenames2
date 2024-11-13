export default class Card {
  constructor(id, word, team) {
    this.id = id
    this.word = word
    this.teamId = team.id
    this.color = team.color
    this.revealed = false
  }

  /**
   * Sets the card as "revealed" and returns this.teamId
   */
  revealTeam() {
    this.revealed = true
    return this.teamId
  }
}
