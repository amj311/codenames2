import Game from '../entities/Game.js';
import UserConnection from '../entities/UserConnection.js';
import { getCaptainsTeam } from '../services/GameHelpers.js';
import UniqueIdManager from '../services/UniqueIdManager.js';

const WAS_CAPTAIN_TEAM = 'WAS_CAPTAIN_TEAM';
const userIds = new UniqueIdManager(10);

const ACTIVE_USER_TIME = 60 * 1000;

export default class GameRoom {
  id: string;
  game = new Game();
  users = new Map();
  lostConnections = new Map();
  hostUserId!: string;

  constructor(id: string, hostUserData?: any) {
    this.id = id;
    this.createHostUser();
  }

  private createHostUser(hostUserData: any = {}) {
    const host = this.registerNewUser({
      username: 'Host',
      isHost: true,
      isPlayer: true,
      ...hostUserData
    });
    this.hostUserId = host.id;
    return host;
  }

  public joinNewPlayer() {
    return this.registerNewUser({
      username: '',
      isHost: false,
      isPlayer: true,
    });
  }

  public rejoinUser(userData) {
    const existingUser = this.users.get(userData.id);
    if (existingUser) {
      existingUser.connection.ping();
      return this.users.get(userData.id);
    }
    return this.registerNewUser(userData);
  }

  registerNewUser(userData) {
    const newUserId = userIds.getNew();
    const newUser = {
      id: newUserId,
      connection: new UserConnection(newUserId),
      ...userData,
    }
    this.users.set(newUserId, newUser);
    // this.setupPlayerSocket(socket, userData, () => {
    //     this.emitToAllConnections('handleRoomUpdate', {
    //         method: 'playerConnect',
    //         payload: userData,
    //     });
    //     socket.emit('updateRoom', this.getRoomSummary());
    //     socket.emit('updateGamePieces', this.game);
    // });
    return newUser;
  }

  get activeUsers() {
    return Array.from(this.users.values()).filter((u) => u.connection.lastPing > Date.now() - ACTIVE_USER_TIME);
  }

  get hostUser() {
    return this.users.get(this.hostUserId);
  }

  // setupPlayerSocket(socket: any, userData: any, cb: () => void) {
  //     console.log('setting up socket ' + socket.id);
  //     this.connections.set(socket.id, new UserConnectionRecord(socket, userData));

  //     socket.on('invokeGameMethod', (method: string, args: any[], callback: (payload: any) => void) => {
  //         const payload = this.game[method](...args, callback);
  //         this.emitToAllConnections('handleGameplay', { method, payload });
  //     });

  //     socket.on('updateGamePieces', (props: any) => {
  //         for (const key of Object.keys(props)) {
  //             this.game[key] = props[key];
  //         }
  //         this.emitToAllConnections('updateGamePieces', props);
  //     });

  //     socket.on('leaveRoom', () => {
  //         const oldConn = this.connections.get(socket.id);
  //         if (!oldConn) return;

  //         this.connections.delete(socket.id);

  //         this.handleLostUserRecord(oldConn);
  //     });

  //     socket.on('updateUserData', (newUserData: any) => {
  //         this.connections.set(socket.id, new UserConnectionRecord(socket, newUserData));
  //         console.log('new user data', this.connections.get(socket.id).userData);
  //         this.emitToAllConnections('updatePlayers', this.getPlayers());
  //     });

  //     socket.on('disconnect', () => {
  //         this.handleLostSocket(socket);
  //     });

  //     cb();
  // }

  public get actions() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const room = this;
    return {
      async pingUser(userId: string) {
        const user = room.users.get(userId);
        if (!user) {
          throw new Error('User not found in room!');
        };
        user.connection.ping();
      },

      async updateUserData(userId: string, newUserData: any) {
        const user = room.users.get(userId);
        for (const key of Object.keys(newUserData)) {
          user[key] = newUserData[key];
        }
        console.log(user)
      }
    }
  }

  async doRoomAction(userId: string, action: keyof typeof this.actions, data) {
    return await this.actions[action](userId, data);
  }


  async doGameAction(userId: string, action: keyof typeof this.game.actions, data) {
    await this.game.actions[action](userId, data);
  }

  getRoomSummary() {
    return {
      id: this.id,
      players: this.getPlayers(),
      users: Array.from(this.users.values()),
    };
  }

  getPlayers() {
    return Array.from(this.users.values()).filter((u) => u.isPlayer);
  }

  // handleLostSocket(socket: any) {
  //   const lostConn = this.connections.get(socket.id);
  //   if (!lostConn) return;

  //   console.log('Lost user: ' + socket.id, lostConn.userData);

  //   this.connections.delete(socket.id);
  //   this.lostConnections.set(socket.id, lostConn);

  //   this.handleLostUserRecord(lostConn);
  // }

  // handleLostUserRecord(record: UserConnection) {
  //   const userData = this.users.get(record.userId);
  //   if (userData.isHost)
  //     this.emitToAllConnections('handleRoomUpdate', {
  //       method: 'hostDisconnect',
  //       payload: userData,
  //     });
  //   if (userData.isPlayer)
  //     this.emitToAllConnections('handleRoomUpdate', {
  //       method: 'playerDisconnect',
  //       payload: userData,
  //     });

  //   const captainTeam = getCaptainsTeam(userData, this.game.teams);
  //   if (captainTeam) {
  //     record.setMeta('wasCaptainOfTeam', captainTeam);
  //     this.game.setTeamCaptain(false, captainTeam.id, userData);
  //     this.emitToAllConnections('updateGamePieces', this.game);
  //   }
  //   this.emitToAllConnections('updatePlayers', this.getPlayers());
  // }

  // canReconnect(socketId: string) {
  //   return this.lostConnections.has(socketId) || this.connections.has(socketId);
  // }

  // handleReturningPlayer(newSocket: any, oldSockId: string, cb: (userData: any, game: Game, roomSummary: any) => void) {
  //   const oldConnPair = this.lostConnections.get(oldSockId) || this.connections.get(oldSockId);
  //   if (!oldConnPair) return false;

  //   this.lostConnections.delete(oldSockId);

  //   const oldUserData = oldConnPair.userData;
  //   console.log('returning user:', oldSockId, oldUserData);

  //   if (oldUserData.isHost)
  //     this.emitToAllConnections('handleRoomUpdate', {
  //       method: 'hostReconnect',
  //       payload: oldUserData,
  //     });
  //   if (oldUserData.isPlayer)
  //     this.emitToAllConnections('handleRoomUpdate', {
  //       method: 'playerReconnect',
  //       payload: oldUserData,
  //     });

  //   if (oldConnPair.hasMeta(WAS_CAPTAIN_TEAM)) {
  //     const oldTeamId = oldConnPair.getMeta(WAS_CAPTAIN_TEAM).id;

  //     if (!this.game.teams[oldTeamId].captain) {
  //       this.game.setTeamCaptain(true, oldTeamId, oldUserData);
  //     }
  //     this.emitToAllConnections('updateGamePieces', this.game);
  //   }

  //   if (newSocket.id != oldSockId)
  //     this.setupPlayerSocket(newSocket, oldUserData, () => {
  //       cb(oldUserData, this.game, this.getRoomSummary());
  //     });
  //   this.emitToAllConnections('updatePlayers', this.getPlayers());

  //   return true;
  // }

  // beforeClose() {
  //   Array.from(this.connections.values()).forEach((c) => {
  //     this.connections.delete(c.socket.id);
  //     c.socket.emit('roomClosed');
  //   });
  // }

  // emitToAllConnections(action: string, data: any) {
  //   Array.from(this.connections.values()).forEach((c) => {
  //     c.socket.emit(action, data);
  //   });
  // }
}

