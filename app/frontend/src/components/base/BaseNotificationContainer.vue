<script>
import { mapState } from 'pinia';
import BaseNotificationBar from '~/components/base//BaseNotificationBar.vue';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

export default {
  components: {
    BaseNotificationBar,
  },
  computed: {
    ...mapState(useNotificationStore, ['notifications']),
    ...mapState(useFormStore, ['isRTL']),
  },
};
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
