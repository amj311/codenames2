import { defineStore } from 'pinia'

// const savedState = localStorage.hasItem('savedState') ? JSON.parse(localStorage.getItem('savedState')!) : null

export const useGameStore = defineStore('game', {
  state: () => ({
    savedState: null,
    gameRoomId: null as string | null,
    user: null as any,
    gameState: null as any
  }),
  actions: {
    setGameRoomId(id: string) {
      this.gameRoomId = id
    },
    setGameState(game) {
      this.gameState = game
    },
    setUser(user) {
      this.user = user
    },
  },
  getters: {
    isHost(state) {
      return state.user && state.user.isHost;
    }
  }
})
