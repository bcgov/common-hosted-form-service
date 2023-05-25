<script setup>
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/auth';

defineProps({
  msg: {
    type: String,
    default: 'Error: Something went wrong... :(',
  },
});

const authStore = useAuthStore();
const { authenticated, ready } = storeToRefs(authStore);
</script>

<template>
  <v-container class="text-center">
    <h1 class="my-6">{{ msg }}</h1>
    <div v-if="ready" class="d-print-none">
      <v-btn
        v-if="authenticated"
        color="primary"
        size="large"
        @click="authStore.logout"
      >
        <span>Logout</span>
      </v-btn>
    </div>
  </v-container>
</template>
