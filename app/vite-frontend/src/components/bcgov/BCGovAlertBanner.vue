<script setup>
import { computed } from 'vue';

import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

const notificationStore = useNotificationStore();

const props = defineProps({
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
    default: 'Error: Something went wrong.',
  },
  type: {
    default: 'error',
    type: String,
  },
});

const notificationType = computed(() => {
  switch (props.type) {
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

const onClose = () => {
  notificationStore.deleteNotification({ id: props.id });
};
</script>

<template>
  <div class="ma-5">
    <v-alert
      :id="props.id"
      :color="notificationType.color"
      :icon="notificationType.icon"
      :title="props.title"
      :text="props.text"
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
