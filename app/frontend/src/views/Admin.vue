<template>
  <BaseSecure :admin="true">
    <v-container>
      <h1 class="mt-6">Admin</h1>
      <AdminPage />
    </v-container>
  </BaseSecure>
</template>

<script>
import { mapGetters } from 'vuex';

import admin from '@/store/modules/admin.js';
import AdminPage from '@/components/admin/AdminPage.vue';

export default {
  name: 'Admin',
  components: {
    AdminPage,
  },
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
