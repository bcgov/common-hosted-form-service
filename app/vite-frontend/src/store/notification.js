import { defineStore } from 'pinia';
import getRouter from '~/router';
import { NotificationTypes } from '~/utils/constants';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    notificationId: 1,
  }),
  getters: {},
  actions: {
    errorNavigate(msg) {
      const router = getRouter(
        router.app.config.globalProperties.$config.basePath
      );
      router.replace({ name: 'Error', params: { msg: msg } });
    },
    alertNavigate(type, message) {
      const router = getRouter(
        router.app.config.globalProperties.$config.basePath
      );
      router.replace({
        name: 'Alert',
        params: { message: message, type: type },
      });
    },
    addNotification(notification) {
      if (notification.consoleError) console.error(notification.consoleError); // eslint-disable-line no-console
      if (!notification.type)
        notification = { ...notification, ...NotificationTypes.ERROR };
      this.notifications.push({
        ...notification,
        id: this.notificationId++,
      });
    },
    deleteNotification(notification) {
      this.notifications = this.notifications.filter(
        (n) => n.id !== notification.id
      );
    },
  },
});
