<script>
import { mapActions, mapState } from 'pinia';
import { useAuthStore } from '~/store/auth';

export default {
  props: {
    msg: {
      default: 'Error: Something went wrong... :(',
      type: String,
    },
  },
  computed: {
    ...mapState(useAuthStore, ['authenticated', 'ready']),
  },
  methods: mapActions(useAuthStore, ['logout']),
};
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
