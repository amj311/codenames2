const urlB64ToUint8Array = (base64String) => {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
};

// This code executes in its own worker or thread
self.addEventListener('install', (event) => {
	console.log('Service worker installed');
});
self.addEventListener('activate', async (event) => {
	console.log('Service worker activate');
	try {
		const applicationServerKey = urlB64ToUint8Array(
			'BJ5IxJBWdeqFDJTvrZ4wNRu7UY2XigDXjgiUBYEYVXDudxhEs0ReOJRBcBHsPYgZ5dyV8VjyqzbQKS8V7bUAglk'
		);
		const options = { applicationServerKey, userVisibleOnly: true };
		const subscription = await self.registration.pushManager.subscribe(options);
		console.log(JSON.stringify(subscription));
	} catch (err) {
		console.log('Error', err);
	}
});

self.addEventListener('push', function (event) {
	if (event.data) {
		console.log('Push event!! ', event.data.text());
	} else {
		console.log('Push event but no data');
	}
});

// on('push', function (event) {
// 	console.log('Push event!! ', event.data.text());
// });
