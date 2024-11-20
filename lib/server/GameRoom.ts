import Game from '../entities/Game.js';
import UserConnection from '../entities/UserConnection.js';
import UniqueIdManager from '../services/UniqueIdManager.js';

const userIds = new UniqueIdManager(10);

const ACTIVE_USER_TIME = 60 * 1000;

export default class GameRoom {
  id: string;
  game = new Game();
  users = new Map();
  lostConnections = new Map();
  hostUserId!: string;

  constructor(id: string) {
    this.id = id;
    this.createHostUser();
  }

  private createHostUser() {
    const host = this.registerNewUser({
      username: 'Host',
      isHost: true,
      isPlayer: true,
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

  public joinUser(returningUserId = '') {
    const existingUser = this.users.get(returningUserId);
    if (existingUser) {
      existingUser.connection.ping();
      return this.users.get(returningUserId);
    }
    return this.registerNewUser();
  }

  registerNewUser(userData = {}) {
    const newUserId = userIds.getNew();
    const newUser = {
      id: newUserId,
      connection: new UserConnection(newUserId),
      ...userData,
    }
    this.users.set(newUserId, newUser);
    return newUser;
  }

  get activeUsers() {
    return Array.from(this.users.values()).filter((u) => u.connection.lastPing > Date.now() - ACTIVE_USER_TIME);
  }

  get hostUser() {
    return this.users.get(this.hostUserId);
  }

  public get actions() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const room = this;
    return {
      async pingUser(userId: string) {
        const user = room.users.get(userId);
        if (!user) {
          return;
        };
        user.connection.ping();
      },

      updateUserData(userId: string, newUserData: any) {
        const user = room.users.get(userId);
        for (const key of Object.keys(newUserData)) {
          user[key] = newUserData[key];
        }
      },

      leaveRoom(userId: string) {
        if (userId === room.hostUserId) {
          this.hostUserId = null;
        }
        room.game.removePlayer(userId);
        room.users.delete(userId);
      },
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
}
