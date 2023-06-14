<template>
  <div class="ma-5">
    <v-alert :class="notificationType.class" :icon="notificationType.icon">
      <div v-html="message" />
    </v-alert>
  </div>
</template>

<script>
import { NotificationTypes } from '@/utils/constants';
import i18n from '@/internationalization';

export default {
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
  },

  name: 'BCGovAlertBanner',

  props: {
    message: {
      default: i18n.t('trans.bcGovAlertBanner.defaultErrMsg'),
      type: String,
    },
    type: {
      default: i18n.t('trans.bcGovAlertBanner.error'),
      type: String,
    },
  },
};
</script>
