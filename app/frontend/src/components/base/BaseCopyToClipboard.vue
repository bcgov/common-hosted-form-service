<template>
  <span>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          color="primary"
          :disabled="disabled"
          icon
          v-clipboard:copy="copyText"
          v-clipboard:success="clipboardSuccessHandler"
          v-clipboard:error="clipboardErrorHandler"
          v-bind="attrs"
          v-on="on"
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
import Vue from 'vue';
import VueClipboard from 'vue-clipboard2';
import { NotificationTypes } from '@/utils/constants';

VueClipboard.config.autoSetContainer = true;
Vue.use(VueClipboard);

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
        message: 'Error attempting to copy to clipboard.',
      });
    },
  },
};
</script>
