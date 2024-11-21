import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

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

    const notification = new Notification(title, {
      icon: '/blue.png',
      ...options,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    }
  }


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
  }
})
