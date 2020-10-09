<template>
  <v-alert
    :type="notification.type"
    prominent
    dismissible
    @input="alertClosed"
    transition="slide-y-transition"
  >
    {{ notification.message }}
  </v-alert>
</template>

<script>
import { mapActions } from 'vuex';
export default {
  props: {
    notification: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      timeout: null,
    };
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
      10000
    );
  },
  beforeDestroy() {
    // Prevent memory leak if component destroyed before timeout up
    clearTimeout(this.timeout);
  },
};
</script>
