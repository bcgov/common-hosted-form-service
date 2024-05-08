<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { useAuthStore } from '~/store/auth';
import { AppPermissions } from '~/utils/constants';

const { isAdmin } = storeToRefs(useAuthStore());
const APP_PERMS = computed(() => AppPermissions);
</script>

<template>
  <BaseSecure :admin="isAdmin" :permission="APP_PERMS.VIEWS_ADMIN">
    <v-container>
      <router-view v-slot="{ Component }">
        <transition name="component-fade" mode="out-in">
          <component :is="Component"></component>
        </transition>
      </router-view>
    </v-container>
  </BaseSecure>
</template>
