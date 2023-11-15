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
    /*
     * Navigates to the error view
     * @param msg The locale message
     */
    errorNavigate(msg) {
      const router = getRouter();
      router.replace({
        name: 'Error',
        query: { text: typeof msg === 'object' ? JSON.stringify(msg) : msg },
      });
    },
    /*
     * Navigates to the alert banner view
     * @param msg The locale message
     */
    alertNavigate(type, msg) {
      const router = getRouter();
      router.replace({
        name: 'Alert',
        params: {
          text: msg,
          type: type,
        },
      });
    },
    /*
     * We add notifications here that aren't translated. When calling
     * this function, you need to send in the locale message. We translate
     * it in the final component.
     */
    addNotification(notification) {
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
