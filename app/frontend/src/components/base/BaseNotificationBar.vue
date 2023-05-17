<template>
  <v-alert
    :class="'target-notification ' + notification.class"
    :icon="notification.icon"
    prominent
    closable
    standard-easing="slide-y-transition"
    @update:modelValue="alertClosed"
  >
    <h3 v-if="notification.title">{{ notification.title }}</h3>
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
      title: String,
      message: Object,
      type: Object,
      timeout: Number, // in seconds
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
      this.notification.timeout ? this.notification.timeout * 1000 : 10000
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
