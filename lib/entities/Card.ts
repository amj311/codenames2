export default class Card {
  id: number
  word: string
  suiteId: string
  color: string
  revealed: boolean

  constructor(id: number, word: string, suite) {
    this.id = id
    this.word = word
    this.suiteId = suite.id
    this.color = suite.color
    this.revealed = false
  }

  revealTeam(): string {
    this.revealed = true;
    return this.suiteId;
  }
}
