import { defineStore } from 'pinia';
import { PING_INTERVAL } from '../../lib/constants';
import api from '@/services/api';

// const savedState = localStorage.hasItem('savedState') ? JSON.parse(localStorage.getItem('savedState')!) : null

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
  }),
  actions: {
    loadGameRoom(id: string) {
      this.gameRoomId = id;
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
      if (this.pingTimeout) {
        clearTimeout(this.pingTimeout);
      }
      this.doPing();
    },
    async doPing() {
      try {
        await this.doRoomAction('pingUser');
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
    },

    getUserById(userId) {
      return this.roomState.users.find((user) => user.id === userId);
    },

    async doGameAction(action, data?) {
      const { data: resData } = await api.post('/room/' + this.gameRoomId + '/game-action/' + action, {
        userId: this.user.id,
        data,
      });
      if (!resData.success) {
        throw new Error("Server Error");
      }
      this.setGameState(resData.game);
      this.setRoomState(resData.room);
      this.setUser(resData.user);
      return resData.actionRes;
    },
    async doRoomAction(action, data?) {
      const { data: resData } = await api.post('/room/' + this.gameRoomId + '/room-action/' + action, {
        userId: this.user.id,
        data,
      });
      if (!resData.success) {
        throw new Error("Server Error");
      }
      this.setGameState(resData.game);
      this.setRoomState(resData.room);
      this.setUser(resData.user);
      return resData.actionRes;
    },
  },
  getters: {
    isHost(state) {
      return state.user && state.user.isHost;
    },
  }
})
