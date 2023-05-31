<script setup>
import { useNotificationStore } from '~/store/notification';

const notificationStore = useNotificationStore();

const props = defineProps({
  notification: {
    type: Object,
    default: () => {},
  },
});

const timeout = setTimeout(
  () => notificationStore.deleteNotification(props.notification),
  props.notification.timeout ? props.notification.timeout * 1000 : 10000
);

notificationStore.$onAction(({ name, _store, args, after, onError }) => {
  after(() => {
    if (name === 'deleteNotification') {
      if (props.notification.id === args[0].id) {
        clearTimeout(timeout);
      }
    }
  });

  onError((error) => {
    console.error(error); // eslint-disable-line no-console
  });
});
</script>

<template>
  <v-alert
    :id="notification.id"
    :class="'target-notification ' + notification.class"
    :icon="notification.icon"
    prominent
    dismissable
    :title="notification.title"
    :text="notification.text"
    @update:modelValue="alertClosed"
  ></v-alert>
</template>

<style scoped>
.target-notification :deep(.v-alert__icon.v-icon):after {
  display: none;
}
</style>
