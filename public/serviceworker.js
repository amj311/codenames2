// const urlB64ToUint8Array = (base64String) => {
// 	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
// 	const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
// 	const rawData = atob(base64);
// 	const outputArray = new Uint8Array(rawData.length);
// 	for (let i = 0; i < rawData.length; ++i) {
// 		outputArray[i] = rawData.charCodeAt(i);
// 	}
// 	return outputArray;
// };

// This code executes in its own worker or thread
self.addEventListener('install', () => {
	console.log('Service worker installed');
});

async function fetchAsync(url) {
	const response = await fetch(url);
	console.log(response);
	return await response.text();
}

self.addEventListener('activate', async () => {
	console.log('Service worker activated');
	try {
		const apiOrigin = self.location.origin.includes(':517')
			? 'http://localhost:5000/api'
			: '/api';
		const applicationServerKey = await fetchAsync(apiOrigin + '/vapidkey');
		console.log(applicationServerKey);
		const options = { applicationServerKey, userVisibleOnly: true };
		await self.registration.pushManager.subscribe(options);
	} catch (err) {
		console.log('Error', err);
	}
});

self.addEventListener('push', async function (event) {
	let notifData;
	try {
		notifData = JSON.parse(event.data.text());
	} catch (e) {
		console.log('Error', e);
	}
	if (!notifData?.gameRoomId || !notifData?.title) {
		console.log('Received malformed notification', notifData);
		return;
	}

	const data = JSON.parse(event.data.text());
	self.registration.showNotification(data.title, {
		icon: '/blue.png',
		badge: '/mask.png',
		data: { gameRoomId: data.gameRoomId },
		body: data.body,
		vibrate: [200],
		tag: 'game_' + data.gameRoomId,
		renotify: true,
	});
});

self.addEventListener('notificationclick', async (event) => {
	const gameRoomId = event.notification.data.gameRoomId;
	const gameUrl = self.location.origin + '/' + gameRoomId;

	event.notification.close();
	event.waitUntil(
		(async () => {
			const openTabs = await clients.matchAll({ type: 'window' });
			const gameTab = openTabs.find((tab) => {
				console.log(self);
				return tab.url === gameUrl;
			});

			if (gameTab) {
				gameTab.focus();
			} else {
				await clients.openWindow(gameUrl);
			}
		})()
	);
});

// on('push', function (event) {
// 	console.log('Push event!! ', event.data.text());
// });
