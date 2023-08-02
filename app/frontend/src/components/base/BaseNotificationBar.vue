<script>
import { useNotificationStore } from '~/store/notification';
import { mapState } from 'pinia';
import { useFormStore } from '~/store/form';

export default {
  props: {
    notification: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      timeout: null,
    };
  },
  computed: {
    ...mapState(useFormStore, ['form', 'isRTL']),
  },

  mounted() {
    const notificationStore = useNotificationStore();
    this.timeout = setTimeout(
      () => notificationStore.deleteNotification(this.notification),
      this.notification.timeout ? this.notification.timeout * 1000 : 10000
    );
  },
  beforeUnmount() {
    // Prevent memory leak if component destroyed before timeout up
    clearTimeout(this.timeout);
  },
  methods: {
    alertClosed() {
      const notificationStore = useNotificationStore();
      notificationStore.deleteNotification(this.notification);
    },
  },
};
</script>

<template>
  <v-alert
    :id="notification.id"
    :class="[
      'target-notification ' + notification.type,
      { 'v-locale--is-ltr': isRTL },
    ]"
    :style="{
      direction: isRTL ? 'rtl' : 'ltl',
      textAlign: isRTL ? 'right' : 'left',
    }"
    :icon="notification.icon"
    prominent
    closable
    :title="notification.title"
    :text="notification.text"
    @update:model-value="alertClosed"
  ></v-alert>
</template>

<style scoped>
.target-notification :deep(.v-alert__icon.v-icon):after {
  display: none;
}
</style>
