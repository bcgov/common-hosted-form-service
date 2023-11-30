<script>
import { mapState } from 'pinia';
import BaseSecure from '~/components/base/BaseSecure.vue';
import { useAuthStore } from '~/store/auth';
import { IdentityProviders } from '~/utils/constants';

export default {
  components: {
    BaseSecure,
  },
  computed: {
    ...mapState(useAuthStore, ['isAdmin']),
    IDP: () => IdentityProviders,
  },
};
</script>

<template>
  <BaseSecure :admin="isAdmin" :idp="[IDP.IDIR]">
    <v-container>
      <router-view v-slot="{ Component }">
        <transition name="component-fade" mode="out-in">
          <component :is="Component"></component>
        </transition>
      </router-view>
    </v-container>
  </BaseSecure>
</template>
