import Game from '../entities/Game.js';
import UserConnection from '../entities/UserConnection.js';
import UniqueIdManager from '../services/UniqueIdManager.js';
import webpush from 'web-push';

const userIds = new UniqueIdManager(10);
const ACTIVE_USER_TIME = 60 * 1000;

type User = {
	id: string;
	connection: UserConnection;
	isPlayer: boolean;
	username: string;
	isActiveTab?: boolean;
}

export default class GameRoom {
	id!: string;
	game!: Game;
	users = new Map<string, User>();
	pushSubscriptions = new Map();
	// lostConnections = new Map();
	hostUserId!: string;

	constructor(id: string) {
		this.id = id;
		this.game = new Game(this);
		this.createHostUser();
	}

	private createHostUser() {
		const host = this.registerNewUser({
			username: 'Host',
			isPlayer: true,
		});
		this.hostUserId = host.id;
		return host;
	}

	public joinUser(returningUserId = '') {
		const existingUser = this.users.get(returningUserId);
		if (existingUser) {
			existingUser.connection.ping();
			return this.users.get(returningUserId);
		}
		return this.joinNewPlayer();
	}

	private joinNewPlayer() {
		return this.registerNewUser({
			username: '',
			isPlayer: true,
		});
	}

	private registerNewUser(userData: Partial<User>) {
		const newUserId = userIds.getNew();
		const newUser = {
			id: newUserId,
			connection: new UserConnection(newUserId),
			...userData,
		} as User;
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
			async pingUser(userId: string, { pushSubscription, isActiveTab }) {
				const user = room.users.get(userId);
				if (!user) {
					return;
				};
				if (pushSubscription) {
					room.pushSubscriptions.set(userId, pushSubscription);
					console.log(pushSubscription, room.pushSubscriptions)
				}
				user.connection.ping();
				user.isActiveTab = isActiveTab;
			},

			updateUserData(userId: string, newUserData: Partial<User>) {
				const user = room.users.get(userId);
				if (!user) {
					return;
				}
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


	public get gameInterface() {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const room = this;
		return {
			async notifyUser(userId: string, notification) {
				try {
					const user = room.users.get(userId);
					const subscription = room.pushSubscriptions.get(userId);
					if (!user || !subscription) {
						console.warn('Cannot notify: user or subscription not found', user, subscription);
						return false;
					};
					if (!room.shouldNotifyUser(userId)) {
						console.warn('Silencing notification for active user', userId);
						return false;
					}
					webpush.setVapidDetails(
						process.env.VAPID_SUBJECT!,
						process.env.VAPID_PUBLIC!,
						process.env.VAPID_PRIVATE!
					)
					await webpush.sendNotification(subscription, JSON.stringify({
						gameRoomId: room.id,
						...notification
					}));
					return true;
				}
				catch (e) {
					console.error('Error notifying user', userId, e);
					return false;
				}

			},
			async notifyBatch(notifications: { userId: string, notification }[]) {
				await Promise.all(notifications.map(({ userId, notification }) => this.notifyUser(userId, notification)));
			},
			async notifyAll(notification) {
				await this.notifyBatch(Array.from(room.users.values()).map((u) => ({ userId: u.id, notification })));
			}
		}
	}

	private shouldNotifyUser(userId: string) {
		const user = this.users.get(userId);
		return user && (!user.isActiveTab || Date.now() > user.connection.lastPing + ACTIVE_USER_TIME);
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
			hostUserId: this.hostUserId,
			players: this.getPlayers(),
			users: Array.from(this.users.values()),
		};
	}

	getPlayers() {
		return Array.from(this.users.values()).filter((u) => u.isPlayer);
	}
}
