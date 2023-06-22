<script setup>
import { computed } from 'vue';
import { i18n } from '~/internationalization';

import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

const { t } = i18n;

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
  textToCopy: {
    required: true,
    type: String,
  },
  snackBarText: {
    type: String,
    default: '',
  },
  tooltipText: {
    type: String,
    default: '',
  },
});

const SNACKBAR_TEXT = computed(() =>
  properties.snackBarText.value
    ? properties.snackBarText.value
    : t('trans.baseCopyToClipboard.linkToClipboard')
);

const TOOLTIP_TEXT = computed(() =>
  properties.tooltipText.value
    ? properties.tooltipText.value
    : t('trans.baseCopyToClipboard.copyToClipboard')
);

function onCopy() {
  notificationStore.addNotification({
    text: SNACKBAR_TEXT.value,
    ...NotificationTypes.INFO,
  });
}

function onError(e) {
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
          size="small"
        >
          <v-icon icon="mdi:mdi-content-copy"></v-icon>
          <span v-if="buttonText">{{ buttonText }}</span>
        </v-btn>
      </template>
      <span>{{ TOOLTIP_TEXT }}</span>
    </v-tooltip>
  </span>
</template>
