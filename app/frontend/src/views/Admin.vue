<template>
  <BaseSecure admin :idp="[IDP.IDIR]">
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
import { IdentityProviders } from '@/utils/constants';

export default {
  name: 'Admin',
  computed: {
    ...mapGetters('auth', ['isAdmin']),
    IDP: () => IdentityProviders,
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
