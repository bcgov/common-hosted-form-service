<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '~/store/auth';

const authStore = useAuthStore();

const { ready, authenticated } = storeToRefs(authStore);
const hasLogin = computed(() => useRoute()?.meta?.hasLogin);
</script>

<template>
  <div v-if="ready" class="d-print-none">
    <v-btn
      v-if="authenticated"
      color="white"
      variant="outlined"
      @click="authStore.logout()"
    >
      <span>Logout</span>
    </v-btn>
    <v-btn
      v-else-if="hasLogin"
      color="white"
      variant="outlined"
      @click="authStore.login()"
    >
      <span>Login</span>
    </v-btn>
  </div>
</template>

<style lang="scss" scoped></style>
