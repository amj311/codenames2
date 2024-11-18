import { defineStore } from 'pinia';
import { PING_INTERVAL } from '../../lib/constants';
import { getCaptainsTeam } from '../../lib/services/GameHelpers';
import api from '@/services/api';

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
  }),
  actions: {
    loadGameRoom(id: string) {
      this.gameRoomId = id;
      this.initPings();
    },
    setGameState(state) {
      this.gameState = state;
      this.updateCache();
    },
    setRoomState(state) {
      this.roomState = state;
      this.updateCache();
    },
    setUser(user) {
      this.user = user;
      this.updateCache();
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

    async doGameAction(action, data?) {
      try {
        const { data: resData } = await api.post('/room/' + this.gameRoomId + '/game-action/' + action, {
          userId: this.user.id,
          data,
        });
        if (!resData.success) {
          throw new Error("Unsuccessful Game Action");
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
    async doRoomAction(action, data?) {
      try {
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
        this.lastSuccessfulAction = Date.now();
        this.pingError = null;
        return resData.actionRes;
      }
      catch (err) {
        this.handlePingError(err);
      }
    },
    updateCache() {
      sessionStorage.setItem('savedState', JSON.stringify({
        gameRoomId: this.gameRoomId,
        user: this.user,
      }));
    },
    getCache() {
      return JSON.parse(sessionStorage.getItem('savedState') || 'null');
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

    async joinGame(rid: string) {
      try {
        const { data } = await api.post('/room/' + rid + '/join');
        this.setUser(data.user);
        this.loadGameRoom(data.room.id);
      }
      catch (err) {
        console.error(err);
      }
    },
  },
  getters: {
    isHost(state) {
      return state.user && state.user.isHost;
    },
    userCaptainOfTeam(state) {
      return getCaptainsTeam(state.user, state.gameState.teams);
    },
  }
})
