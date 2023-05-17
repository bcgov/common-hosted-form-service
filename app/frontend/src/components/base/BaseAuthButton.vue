<template>
  <div v-if="keycloakReady" class="d-print-none">
    <v-btn v-if="authenticated" dark outlined @click="logout">
      <span>{{ $t('trans.baseAuthButton.logout') }}</span>
    </v-btn>
    <v-btn v-else-if="hasLogin" dark outlined @click="login()">
      <span>{{ $t('trans.baseAuthButton.login') }}</span>
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
