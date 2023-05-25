<script setup>
import { storeToRefs } from 'pinia';

import BaseNotificationBar from '~/components/base/BaseNotificationBar.vue';
import { useNotificationStore } from '~/store/notification';

const notificationStore = useNotificationStore();
const { notifications } = storeToRefs(notificationStore);
</script>

<template>
  <div class="notification-container">
    <BaseNotificationBar
      v-for="notification in notifications"
      :key="notification.id"
      :notification="notification"
    />
  </div>
</template>

<style scoped>
.notification-container {
  z-index: 999;
  position: fixed;
  top: 0;
  left: 25%;
  margin-top: 15px;
  width: 50%;
}
</style>
