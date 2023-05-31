<script setup>
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

const notificationStore = useNotificationStore();

const props = defineProps({
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
    default: 'Link copied to clipboard',
  },
  tooltipText: {
    type: String,
    default: 'Copy to Clipboard',
  },
});

const emits = defineEmits(['copied']);

function clipboardSuccessHandler() {
  emits('copied');
  notificationStore.addNotification({
    text: props.snackBarText,
    ...NotificationTypes.INFO,
  });
}
function clipboardErrorHandler() {
  notificationStore.addNotification({
    text: 'Error attempting to copy to clipboard.',
  });
}
</script>

<template>
  <span>
    <v-tooltip location="bottom">
      <template #activator="{ prps }">
        <v-btn
          v-clipboard:copy="copyText"
          v-clipboard:success="clipboardSuccessHandler"
          v-clipboard:error="clipboardErrorHandler"
          color="primary"
          :disabled="disabled"
          icon
          v-bind="prps"
          size="small"
        >
          <v-icon class="mr-1" icon="mdi:mdi-content-copy"></v-icon>
          <span v-if="buttonText">{{ buttonText }}</span>
        </v-btn>
      </template>
      <span>{{ tooltipText }}</span>
    </v-tooltip>
  </span>
</template>
