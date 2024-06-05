<script setup>
import { computed } from 'vue';
import { i18n } from '~/internationalization';

import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

const properties = defineProps({
  id: {
    type: Number,
    default: 0,
  },
  title: {
    type: String,
    default: null,
  },
  text: {
    type: String,
    default: 'trans.bcGovAlertBanner.defaultErrMsg',
  },
  type: {
    type: String,
    default: NotificationTypes.ERROR.type,
  },
  translate: {
    default: true,
    type: Boolean,
  },
});

const notificationType = computed(() => {
  switch (properties.type) {
    case NotificationTypes.ERROR.type:
      return NotificationTypes.ERROR;
    case NotificationTypes.INFO.type:
      return NotificationTypes.INFO;
    case NotificationTypes.SUCCESS.type:
      return NotificationTypes.SUCCESS;
    case NotificationTypes.WARNING.type:
      return NotificationTypes.WARNING;
    default:
      return NotificationTypes.ERROR;
  }
});

const TEXT = computed(() => {
  const msg = properties.translate ? i18n.t(properties.text) : properties.text;
  return msg.replace(/(<([^>]+)>)/gi, '');
});

function onClose() {
  const notificationStore = useNotificationStore();
  notificationStore.deleteNotification({ id: properties.id });
}
</script>

<template>
  <div class="ma-5">
    <v-alert
      :id="id"
      :color="notificationType.color"
      :icon="notificationType.icon"
      :title="title"
      :text="TEXT"
      closable
      @click="onClose"
    >
    </v-alert>
  </div>
</template>

<style scoped>
.target-notification :deep(.v-alert__icon.v-icon):after {
  display: none;
}
</style>
