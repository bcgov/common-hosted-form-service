<script setup>
import { useI18n } from 'vue-i18n';

import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

const { t } = useI18n({ useScope: 'global' });

const properties = defineProps({
  buttonText: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  textToCopy: {
    type: String,
    default: undefined,
  },
  snackBarText: {
    type: String,
    default: undefined,
  },
  tooltipText: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits(['copied']);

const snackBarText =
  properties.snackBarText || t('trans.baseCopyToClipboard.linkToClipboard');

function onCopy() {
  emit('copied');
  const notificationStore = useNotificationStore();
  notificationStore.addNotification({
    text: snackBarText,
    ...NotificationTypes.INFO,
  });
}

function onError(e) {
  const notificationStore = useNotificationStore();
  notificationStore.addNotification({
    text: t('trans.baseCopyToClipboard.errCopyToClipboard'),
    consoleError: e,
  });
}
</script>

<template>
  <span>
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-btn
          v-clipboard:copy="textToCopy"
          v-clipboard:success="onCopy"
          v-clipboard:error="onError"
          color="primary"
          :disabled="disabled"
          icon
          v-bind="props"
          size="x-small"
          :title="buttonText"
        >
          <v-icon icon="mdi:mdi-content-copy"></v-icon>
          <span v-if="buttonText">{{ buttonText }}</span>
        </v-btn>
      </template>
      <span>{{
        tooltipText
          ? tooltipText
          : t('trans.baseCopyToClipboard.copyToClipboard')
      }}</span>
    </v-tooltip>
  </span>
</template>
