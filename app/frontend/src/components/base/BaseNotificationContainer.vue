<script setup>
import { storeToRefs } from 'pinia';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

const { notifications } = storeToRefs(useNotificationStore());
const { isRTL } = storeToRefs(useFormStore());
</script>

<template>
  <div class="notification-container" :class="{ 'dir-rtl': isRTL }">
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
