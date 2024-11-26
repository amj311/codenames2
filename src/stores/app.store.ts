import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useGameStore } from './game.store';

let swRegistration;

export const useAppStore = defineStore('app', () => {
	const teamImgs = {
		teamOne: 'blue',
		teamTwo: 'red',
		bystander: 'yellow',
		assassin: 'black',
	};

	const notificationPermission = ref(Notification?.permission);
	const hasNotificationPermission = computed(() => {
		return notificationPermission.value === 'granted';
	})

	function canNotification() {
		if ('Notification' in window) {
			return true;
		}
		console.log('This browser does not support desktop notification');
		return false;
	}

	function canRequestNotification() {
		if (!canNotification()) return false;
		return Notification.permission !== 'denied';
	}

	async function askNotificationPermission() {
		if (!canNotification()) return;
		const permission = await Notification.requestPermission();
		notificationPermission.value = permission;
		return permission;
	}

	function notify(title, options) {
		if (!document.hidden || !hasNotificationPermission.value) {
			console.log('Choosing not to display notification');
			return;
		};

		const finalOptions = {
			icon: '/blue.png',
			badge: '/blue.png',
			...options,
		}

		const notification = swRegistration ? swRegistration.showNotification(title, finalOptions) : new Notification(title, finalOptions);
		notification.onclick = () => {
			window.focus();
			notification.close();
		}
	}

	async function getSwSubscription() {
		if (!swRegistration) {
			swRegistration = await registerServiceWorker();
		}
		return await swRegistration?.pushManager.getSubscription();
	}


	// use sw to clear notifications
	window.addEventListener('visibilitychange', async () => {
		if (!document.hidden && useGameStore().gameRoomId) {
			for (const notif of (await swRegistration?.getNotifications() || [])) {
				if (notif.tag === 'game_' + useGameStore().gameRoomId) {
					console.log('Closing', notif);
					notif.close();
				}
			};
		}
	})

	return {
		teamImgs,

		canNotification,
		hasNotificationPermission,
		notificationPermission,
		get canRequestNotification() {
			return canRequestNotification();
		},
		askNotificationPermission,
		notify,
		getSwSubscription,

		vibrate(pattern = 50) {
			if ('vibrate' in navigator) {
				navigator.vibrate(pattern);
			}
		}
	}
})





const check = () => {
	if (!('serviceWorker' in navigator)) {
		console.log('No Service Worker support!')
		return false;
	}
	if (!('PushManager' in window)) {
		console.log('No Push API Support!')
		return false;
	}
	return true;
}
const registerServiceWorker = async () => {
	swRegistration = await navigator.serviceWorker.register('serviceworker.js'); //notice the file name
	return swRegistration;
}

const main = async () => { //notice I changed main to async function so that I can use await for registerServiceWorker
	if (!check()) return;
	swRegistration = await registerServiceWorker();
}
main();
