import { defineStore } from 'pinia';
import { PING_INTERVAL } from '../../lib/constants';
import api from '@/services/api';

// const savedState = localStorage.hasItem('savedState') ? JSON.parse(localStorage.getItem('savedState')!) : null

export const useGameStore = defineStore('game', {
  state: () => ({
    savedState: null,
    gameRoomId: null as string | null,
    user: null as any,
    gameState: null as any,
    roomState: null as any,
    pingTimeout: null as any,
  }),
  actions: {
    loadGameRoom(id: string) {
      this.gameRoomId = id;
      this.initPings();
    },
    setUser(user) {
      this.user = user
    },
    initPings() {
      if (this.pingTimeout) {
        clearTimeout(this.pingTimeout);
      }
      this.doPing();
    },
    async doPing() {
      try {
        const { data } = await api.post('/room/' + this.gameRoomId + '/room-action', {
          userId: this.user.id,
          action: 'pingUser',
        });
        this.gameState = data.data.game;
        this.roomState = data.data.room;
        this.schedulePing();
      }
      catch (err) {
        console.error(err);
        this.handlePingError();
      }
    },
    schedulePing() {
      this.pingTimeout = setTimeout(this.doPing, PING_INTERVAL);
    },
    handlePingError() {
    }
  },
  getters: {
    isHost(state) {
      return state.user && state.user.isHost;
    }
  }
})
