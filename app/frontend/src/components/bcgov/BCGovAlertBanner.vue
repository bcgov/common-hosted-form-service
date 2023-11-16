<script>
import { mapActions } from 'pinia';
import { i18n } from '~/internationalization';

import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

export default {
  props: {
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
      default: false,
      type: Boolean,
    },
  },
  computed: {
    notificationType() {
      switch (this.type) {
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
    },
    TEXT() {
      const msg = this.translate ? i18n.t(this.text) : this.text;
      return msg.replace(/(<([^>]+)>)/gi, '');
    },
  },
  methods: {
    ...mapActions(useNotificationStore, ['deleteNotification']),
    onClose() {
      this.deleteNotification({ id: this.id });
    },
  },
};
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
