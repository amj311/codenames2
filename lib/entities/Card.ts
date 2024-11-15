import Team from "./Team"

export default class Card {
  id: number
  word: string
  teamId: string
  color: string
  revealed: boolean

  constructor(id: number, word: string, team: Team) {
    this.id = id
    this.word = word
    this.teamId = team.id
    this.color = team.color
    this.revealed = false
  }

  revealTeam(): string {
    this.revealed = true
    return this.teamId
  }
}
