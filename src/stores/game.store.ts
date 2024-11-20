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
    async newGame() {
      this.clear();
      const { data } = await api.post('/room/new');
      this.upsertJoinedGame({ gameRoomId: data.rid, userId: data.hostUser.id });
      console.log("loaded user!", data.hostUser);
      console.log("saved joined game", this.getJoinedGame(data.rid));
      await this.joinGame(data.rid);
      return data.rid;
    },

    async joinGame(rid: string) {
      console.log("loading joined game", this.getJoinedGame(rid));
      const returningUserId = this.getJoinedGame(rid)?.userId;
      const { data } = await api.post('/room/' + rid + '/join', {
        returningUserId,
      });
      this.clear();
      this.gameRoomId = rid;
      console.log("loaded user!", data.user);
      this.setUser(data.user);
      this.setGameState(data.game);
      this.setRoomState(data.room);
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

    async doAction(type: 'game' | 'room', action, data?) {
      try {
        const { data: resData } = await api.post('/room/' + this.gameRoomId + `/${type}-action/` + action, {
          userId: this.user.id,
          data,
        });
        if (!resData.success) {
          throw new Error(`Unsuccessful ${type} action`);
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

    async doGameAction(action, data?) {
      await this.doAction('game', action, data);
    },
    async doRoomAction(action, data?) {
      await this.doAction('room', action, data);
    },

    getJoinedGames() {
      return JSON.parse(localStorage.getItem('joinedGames') || '{}');
    },
    getJoinedGame(rid) {
      return this.getJoinedGames()[rid];
    },
    upsertJoinedGame({ gameRoomId, userId }) {
      const joinedGames = this.getJoinedGames();
      joinedGames[gameRoomId] = {
        gameRoomId: gameRoomId,
        userId: userId,
      };
      localStorage.setItem('joinedGames', JSON.stringify(joinedGames));
    },
    deleteJoinedGame(gameRoomId) {
      const joinedGames = this.getJoinedGames();
      delete joinedGames[gameRoomId];
      localStorage.setItem('joinedGames', JSON.stringify(joinedGames));
    },
    async leaveGameRoom(rid) {
      await this.doRoomAction('leaveRoom');
      this.clear();
      this.deleteJoinedGame(rid);
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
