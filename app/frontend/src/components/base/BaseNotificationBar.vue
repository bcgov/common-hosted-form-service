<script setup>
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

const { t } = useI18n({ useScope: 'global' });

const properties = defineProps({
  notification: {
    type: Object,
    default: () => {},
  },
});

let timeout = null;

const { isRTL } = storeToRefs(useFormStore());

const TITLE = computed(() =>
  properties.notification?.translate
    ? t(properties.notification.title)
    : properties.notification.title
);

const TEXT = computed(() =>
  properties.notification?.translate
    ? t(properties.notification.text)
    : properties.notification.text
);

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
        t(
          properties.notification.consoleError.text,
          properties.notification.consoleError.options
        )
      );
    } else {
      // eslint-disable-next-line no-console
      console.error(t(properties.notification.consoleError.text));
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
        : t(
            properties.notification.consoleError.text,
            properties.notification.consoleError.options
          )
    );
  }
  const notificationStore = useNotificationStore();
  if (!properties.notification.retain) {
    timeout = setTimeout(
      () => notificationStore.deleteNotification(properties.notification),
      properties.notification.timeout
        ? properties.notification.timeout * 1000
        : 10000
    );
  }
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
    :title="TITLE"
    :text="TEXT"
    @update:model-value="alertClosed"
  ></v-alert>
</template>

<style scoped>
.target-notification :deep(.v-alert__icon.v-icon):after {
  display: none;
}

.v-alert {
  color: white !important;
}

.v-alert-title {
  font-weight: bold !important;
}
</style>
