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
        >
          <v-icon class="mr-1">file_copy</v-icon>
          <span v-if="buttonText">{{ buttonText }}</span>
        </v-btn>
      </template>
      <span>{{ tooltipText }}</span>
    </v-tooltip>
  </span>
</template>

<script>
import { mapActions } from 'vuex';
import { NotificationTypes } from '@src/utils/constants';

export default {
  name: 'BaseCopyToClipboard',
  props: {
    buttonText: {
      type: String,
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
  },
  emits: ['copied'],
  data() {
    return {
      clipSnackbar: {
        on: false,
        color: 'info',
      },
    };
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    clipboardSuccessHandler() {
      this.$emit('copied');
      this.addNotification({
        message: this.snackBarText,
        ...NotificationTypes.INFO,
      });
    },
    clipboardErrorHandler() {
      this.addNotification({
        message: this.$t('trans.baseCopyToClipboard.errCopyToClipboard'),
      });
    },
  },
};
</script>
