<script setup>
import { useI18n } from 'vue-i18n';

import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

const { t } = useI18n({ useScope: 'global' });

const notificationStore = useNotificationStore();

const properties = defineProps({
  buttonText: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  copyText: {
    required: true,
    type: String,
  },
  snackBarText: {
    type: String,
    default: t('trans.baseCopyToClipboard.linkToClipboard'),
  },
  tooltipText: {
    type: String,
    default: t('trans.baseCopyToClipboard.copyToClipboard'),
  },
});

const emits = defineEmits(['copied']);

function clipboardSuccessHandler() {
  emits('copied');
  notificationStore.addNotification({
    text: properties.snackBarText,
    ...NotificationTypes.INFO,
  });
}
function clipboardErrorHandler() {
  notificationStore.addNotification({
    text: t('trans.baseCopyToClipboard.errCopyToClipboard'),
  });
}
</script>

<template>
  <span>
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-btn
          v-clipboard:copy="copyText"
          v-clipboard:success="clipboardSuccessHandler"
          v-clipboard:error="clipboardErrorHandler"
          color="primary"
          :disabled="disabled"
          icon
          v-bind="props"
          size="small"
        >
          <v-icon icon="mdi:mdi-content-copy"></v-icon>
          <span v-if="buttonText">{{ buttonText }}</span>
        </v-btn>
      </template>
      <span>{{ tooltipText }}</span>
    </v-tooltip>
  </span>
</template>
