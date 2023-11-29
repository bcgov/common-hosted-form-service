<script>
import { mapState } from 'pinia';

import { i18n } from '~/internationalization';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

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
    ...mapState(useFormStore, ['form', 'isRTL', 'lang']),
  },
  created() {
    if (this.notification.consoleError) {
      // eslint-disable-next-line no-console
      console.error(
        i18n.t(
          this.notification.consoleError.text,
          this.notification.consoleError.options
        )
      );
    }
  },
  mounted() {
    if (this.notification.consoleError) {
      // eslint-disable-next-line no-console
      console.error(
        typeof this.notification.consoleError === 'string' ||
          this.notification.consoleError instanceof String
          ? this.notification.consoleError
          : i18n.t(
              this.notification.consoleError.text,
              this.notification.consoleError.options
            )
      );
    }
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
    :class="['target-notification ' + notification.type, { 'dir-rtl': isRTL }]"
    :style="{
      direction: isRTL ? 'rtl' : 'ltl',
      textAlign: isRTL ? 'right' : 'left',
    }"
    :type="notification.type"
    :icon="notification.icon"
    prominent
    closable
    :title="notification.title"
    :text="$t(notification.text)"
    @update:model-value="alertClosed"
  ></v-alert>
</template>

<style scoped>
.target-notification :deep(.v-alert__icon.v-icon):after {
  display: none;
}
</style>
