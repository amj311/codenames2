import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router/router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')



// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register("/serviceworker.js")
//     .then((serviceWorkerRegistration) => {
//       serviceWorkerRegistration.pushManager.subscribe().then(
//         (pushSubscription) => {
//           console.log(pushSubscription.subscriptionId);
//           console.log(pushSubscription.endpoint);
//           // The push subscription details needed by the application
//           // server are now available, and can be sent to it using,
//           // for example, the fetch() API.
//         },
//         (error) => {
//           // During development it often helps to log errors to the
//           // console. In a production environment it might make sense to
//           // also report information about errors back to the
//           // application server.
//           console.error(error);
//         },
//       );
//     });;
// }

// const check = () => {
//   if (!('serviceWorker' in navigator)) {
//     console.log('No Service Worker support!')
//     return false;
//   }
//   if (!('PushManager' in window)) {
//     console.log('No Push API Support!')
//     return false;
//   }
//   return true;
// }
// // I added a function that can be used to register a service worker.
// const registerServiceWorker = async () => {
//   const swRegistration = await navigator.serviceWorker.register('serviceworker.js'); //notice the file name
//   return swRegistration;
// }

// const requestNotificationPermission = async () => {
//   const permission = await window.Notification.requestPermission();
//   // value of permission can be 'granted', 'default', 'denied'
//   // granted: user has accepted the request
//   // default: user has dismissed the notification permission popup by clicking on x
//   // denied: user has denied the request.
//   if (permission !== 'granted') {
//     throw new Error('Permission not granted for Notification');
//   }
// }

// const showLocalNotification = (title, body, swRegistration) => {
//   const options = {
//     body,
//     // here you can add more properties like icon, image, vibrate, etc.
//   };
//   // swRegistration.showNotification(title, options);
//   const notif = new Notification(title, options);
//   console.log(notif);
// }

// const main = async () => { //notice I changed main to async function so that I can use await for registerServiceWorker
//   if (!check()) return;
//   const swRegistration = await registerServiceWorker();
//   console.log('Service Worker Registered', swRegistration);
//   await requestNotificationPermission();
//   console.log('Notification Permission', Notification.permission);
//   showLocalNotification('This is title', 'this is the message', swRegistration);
// }
// main();
