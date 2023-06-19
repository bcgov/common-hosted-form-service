import { defineStore } from 'pinia';
import { useRouter } from 'vue-router';
import { NotificationTypes } from '~/utils/constants';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    notificationId: 1,
  }),
  getters: {},
  actions: {
    errorNavigate(msg) {
      const router = useRouter();
      router.replace({ name: 'Error', params: { msg: msg } });
    },
    alertNavigate(type, message) {
      const router = useRouter();
      router.replace({
        name: 'Alert',
        params: { text: message, type: type },
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
