<script setup>
import { storeToRefs } from 'pinia';
import { onBeforeUnmount } from 'vue';
import { onBeforeMount } from 'vue';

import { i18n } from '~/internationalization';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

const properties = defineProps({
  notification: {
    type: Object,
    default: () => {},
  },
});

let timeout = null;

const { isRTL } = storeToRefs(useFormStore());

function alertClosed() {
  const notificationStore = useNotificationStore();
  notificationStore.deleteNotification(properties.notification);
}

if (properties.notification.consoleError) {
  if (typeof properties.notification.consoleError === 'string') {
    // eslint-disable-next-line no-console
    console.error(properties.notification.consoleError);
  } else if (properties.notification.consoleError.text) {
    if (properties.notification.consoleError.options) {
      // eslint-disable-next-line no-console
      console.error(
        i18n.t(
          properties.notification.consoleError.text,
          properties.notification.consoleError.options
        )
      );
    } else {
      // eslint-disable-next-line no-console
      console.error(i18n.t(properties.notification.consoleError.text));
    }
  }
}

onBeforeMount(() => {
  if (properties.notification.consoleError) {
    // eslint-disable-next-line no-console
    console.error(
      typeof properties.notification.consoleError === 'string' ||
        properties.notification.consoleError instanceof String
        ? properties.notification.consoleError
        : i18n.t(
            properties.notification.consoleError.text,
            properties.notification.consoleError.options
          )
    );
  }
  const notificationStore = useNotificationStore();
  timeout = setTimeout(
    () => notificationStore.deleteNotification(properties.notification),
    properties.notification.timeout
      ? properties.notification.timeout * 1000
      : 10000
  );
});

onBeforeUnmount(() => {
  clearTimeout(timeout);
});
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
    class="mb-3"
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
