<script setup>
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAuthStore } from '~/store/auth';

const { locale } = useI18n({ useScope: 'global' });

const authStore = useAuthStore();
const { authenticated, ready } = storeToRefs(authStore);

const hasLogin = computed(() => useRoute()?.meta?.hasLogin);
</script>

<template>
  <div v-if="ready" class="d-print-none">
    <!-- Logout: icon-only on tablet/mobile (< lg), full text on lg+ desktop -->
    <v-btn
      v-if="authenticated"
      id="logoutButton"
      color="white"
      variant="outlined"
      :title="$t('trans.baseAuthButton.logout')"
      :aria-label="$t('trans.baseAuthButton.logout')"
      @click="authStore.logout"
    >
      <v-icon>mdi-logout</v-icon>
      <span :lang="locale" class="d-none d-lg-flex">{{
        $t('trans.baseAuthButton.logout')
      }}</span>
    </v-btn>
    <!-- Login: same responsive pattern -->
    <v-btn
      v-else-if="hasLogin"
      id="loginButton"
      color="white"
      density="default"
      variant="outlined"
      :title="$t('trans.baseAuthButton.login')"
      :aria-label="$t('trans.baseAuthButton.login')"
      @click="authStore.login"
    >
      <v-icon>mdi-login</v-icon>
      <span :lang="locale" class="d-none d-lg-flex">{{
        $t('trans.baseAuthButton.login')
      }}</span>
    </v-btn>
  </div>
</template>

<style scoped>
.v-btn {
  height: 40px;
}
</style>
