<template>
  <div class="ma-5">
    <v-alert :class="notificationType.class" :icon="notificationType.icon">
      <div v-html="message" />
    </v-alert>
  </div>
</template>

<script>
import { NotificationTypes } from '@src/utils/constants';

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
      default: 'Error: Something went wrong.',
      type: String,
    },
    type: {
      default: 'error',
      type: String,
    },
  },
};
</script>
