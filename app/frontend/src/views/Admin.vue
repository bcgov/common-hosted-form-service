<template>
  <BaseSecure admin>
    <v-container>
      <transition name="component-fade" mode="out-in">
        <router-view />
      </transition>
    </v-container>
  </BaseSecure>
</template>

<script>
import { mapGetters } from 'vuex';

import admin from '@/store/modules/admin.js';

export default {
  name: 'Admin',
  computed: {
    ...mapGetters('auth', ['isAdmin']),
  },
  created() {
    if (this.$store.hasModule('admin')) {
      this.$store.unregisterModule('admin');
    }
    if (this.isAdmin) {
      this.$store.registerModule('admin', admin);
    }
  },
};
</script>

<style scoped>
.component-fade-enter-active,
.component-fade-leave-active {
  transition: opacity 0.3s ease;
}
.component-fade-enter,
.component-fade-leave-to {
  opacity: 0;
}
</style>
