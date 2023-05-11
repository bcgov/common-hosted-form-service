<template>
  <div v-if="keycloakReady" class="d-print-none">
    <v-btn v-if="authenticated" variant="outlined" @click="logout">
      <span>Logout</span>
    </v-btn>
    <v-btn v-else-if="hasLogin" variant="outlined" @click="login()">
      <span>Login</span>
    </v-btn>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'BaseAuthButton',
  computed: {
    ...mapGetters('auth', ['authenticated', 'keycloakReady']),
    hasLogin() {
      return this.$route && this.$route.meta && this.$route.meta.hasLogin;
    },
  },
  methods: mapActions('auth', ['login', 'logout']),
};
</script>
