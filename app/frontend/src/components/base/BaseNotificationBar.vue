<template>
  <v-alert
    :class="['target-notification ' + notification.class, { 'dir-rtl': isRTL }]"
    :icon="notification.icon"
    prominent
    dismissible
    @input="alertClosed"
    transition="slide-y-transition"
  >
    <h3 v-if="notification.title" :lang="lang">
      {{ notification.title }}
    </h3>
    {{ notification.message }}
  </v-alert>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
export default {
  name: 'BaseNotificationBar',
  props: {
    notification: {
      class: Object,
      icon: Object,
      title: String,
      message: Object,
      timeout: Number, // in seconds
    },
  },
  data() {
    return {
      timeout: null,
    };
  },
  computed: {
    ...mapGetters('form', ['isRTL', 'lang']),
  },
  methods: {
    ...mapActions('notifications', ['deleteNotification']),
    alertClosed() {
      this.deleteNotification(this.notification);
    },
  },
  mounted() {
    this.timeout = setTimeout(
      () => this.deleteNotification(this.notification),
      this.notification.timeout ? this.notification.timeout * 1000 : 10000
    );
  },
  beforeDestroy() {
    // Prevent memory leak if component destroyed before timeout up
    clearTimeout(this.timeout);
  },
};
</script>

<style scoped>
.target-notification >>> .v-alert__icon.v-icon:after {
  display: none;
}
</style>
