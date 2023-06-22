<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

const { t } = useI18n({ useScope: 'global' });

const notificationStore = useNotificationStore();

const properties = defineProps({
  id: {
    type: Number,
    default: 0,
  },
  title: {
    type: String,
    default: '',
  },
  text: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: '',
  },
});

const notificationType = computed(() => {
  switch (TYPE.value) {
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

const TYPE = computed(() =>
  properties.type ? properties.type : t('trans.bcGovAlertBanner.error')
);
const TEXT = computed(() =>
  properties.text
    ? properties.text.replace(/(<([^>]+)>)/gi, '')
    : t('trans.bcGovAlertBanner.defaultErrMsg')
);

const onClose = () => {
  notificationStore.deleteNotification({ id: properties.id });
};
</script>

<template>
  <div class="ma-5">
    <v-alert
      :id="properties.id"
      :color="notificationType.color"
      :icon="notificationType.icon"
      :title="properties.title"
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
