<template>
  <v-alert
    :class="'target-notification ' + notification.class"
    :icon="notification.icon"
    prominent
    dismissible
    transition="slide-y-transition"
    @input="alertClosed"
  >
    {{ notification.message }}
  </v-alert>
</template>

<script>
import { mapActions } from 'vuex';
export default {
  name: 'BaseNotificationBar',
  props: {
    notification: {
      class: Object,
      icon: Object,
      message: Object,
      type: Object,
    },
  },
  data() {
    return {
      timeout: null,
    };
  },
  mounted() {
    this.timeout = setTimeout(
      () => this.deleteNotification(this.notification),
      10000
    );
  },
  beforeUnmount() {
    // Prevent memory leak if component destroyed before timeout up
    clearTimeout(this.timeout);
  },
  methods: {
    ...mapActions('notifications', ['deleteNotification']),
    alertClosed() {
      this.deleteNotification(this.notification);
    },
  },
};
</script>

<style scoped>
.target-notification :deep(.v-alert__icon.v-icon):after {
  display: none;
}
</style>
