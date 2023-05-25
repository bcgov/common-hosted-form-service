<script setup>
import BCGovAlertBanner from '../bcgov/BCGovAlertBanner.vue';
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
  <BCGovAlertBanner
    :id="notification.id"
    :title="notification.title"
    :text="notification.text"
    :type="notification.type"
  ></BCGovAlertBanner>
</template>

<style scoped>
.target-notification :deep(.v-alert__icon.v-icon):after {
  display: none;
}
</style>
