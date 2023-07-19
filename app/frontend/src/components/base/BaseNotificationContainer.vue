<template>
  <div class="notification-container" :class="{ 'dir-rtl': isRTL }">
    <BaseNotificationBar
      v-for="notification in notifications"
      :key="notification.id"
      :notification="notification"
    />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
export default {
  name: 'BaseNotificationContainer',
  computed: {
    ...mapState('notifications', ['notifications']),
    ...mapGetters('form', ['isRTL']),
  },
};
</script>

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
