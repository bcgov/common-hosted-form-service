<script setup>
import { storeToRefs } from 'pinia';

import { useAuthStore } from '~/store/auth';
import { IdentityProviders } from '~/utils/constants';

const { isAdmin } = storeToRefs(useAuthStore());
</script>

<template>
  <BaseSecure :admin="isAdmin" :idp="[IdentityProviders.IDIR]">
    <v-container>
      <router-view v-slot="{ Component }">
        <transition name="component-fade" mode="out-in">
          <component :is="Component"></component>
        </transition>
      </router-view>
    </v-container>
  </BaseSecure>
</template>
