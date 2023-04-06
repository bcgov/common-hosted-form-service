<template>
  <v-container class="text-center">
    <h1 class="my-6">{{ msg }}</h1>
    <div v-if="keycloakReady" class="d-print-none">
      <v-btn v-if="authenticated" color="primary" large @click="logout">
        <span>Logout</span>
      </v-btn>
    </div>
  </v-container>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'Error',
  props: {
    msg: {
      default: 'Error: Something went wrong... :(',
      type: String,
    },
  },
  computed: {
    ...mapGetters('auth', ['authenticated', 'keycloakReady']),
  },
  methods: mapActions('auth', ['logout']),
};
</script>
