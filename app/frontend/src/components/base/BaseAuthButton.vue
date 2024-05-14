<script setup>
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';

const authStore = useAuthStore();

const { authenticated, ready } = storeToRefs(authStore);
const { lang } = storeToRefs(useFormStore());

const hasLogin = computed(() => useRoute()?.meta?.hasLogin);
</script>

<template>
  <div v-if="ready" class="d-print-none">
    <v-btn
      v-if="authenticated"
      id="logoutButton"
      color="white"
      variant="outlined"
      @click="authStore.logout"
    >
      <span :lang="lang">{{ $t('trans.baseAuthButton.logout') }}</span>
    </v-btn>
    <v-btn
      v-else-if="hasLogin"
      id="loginButton"
      color="white"
      variant="outlined"
      @click="authStore.login"
    >
      <span :lang="lang">{{ $t('trans.baseAuthButton.login') }}</span>
    </v-btn>
  </div>
</template>
