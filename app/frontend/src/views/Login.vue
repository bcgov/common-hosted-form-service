<template>
  <v-container class="text-center">
    <div v-if="keycloakReady && !authenticated">
      <h1 class="my-6" :lang="lang">
        {{ $t('trans.login.authenticateWith') }}
      </h1>
      <v-row v-for="button in buttons" justify="center" :key="button.type">
        <v-col sm="3" v-if="buttonEnabled(button.type)">
          <v-btn block color="primary" @click="login(button.type)" large>
            <span>{{ button.label }}</span>
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <div v-else>
      <h1 class="my-6" :lang="lang">
        {{ $t('trans.login.alreadyLoggedIn') }}
      </h1>
      <router-link :to="{ name: 'About' }">
        <v-btn color="primary" large :lang="lang">
          <v-icon left>home</v-icon>
          <span :lang="lang">{{ $t('trans.login.about') }}</span>
        </v-btn>
      </router-link>
    </div>
  </v-container>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import { IdentityProviders } from '@/utils/constants';

export default {
  name: 'Login',
  props: {
    idpHint: {
      type: Array,
      default: () => [
        IdentityProviders.IDIR,
        IdentityProviders.BCEIDBUSINESS,
        IdentityProviders.BCEIDBASIC,
      ],
    },
  },
  created() {
    // If component gets idpHint, invoke login flow via vuex
    if (this.idpHint && this.idpHint.length === 1) this.login(this.idpHint[0]);
  },
  computed: {
    ...mapGetters('auth', ['authenticated', 'createLoginUrl', 'keycloakReady']),
    ...mapGetters('form', ['lang']),
    buttons: () => [
      {
        label: 'IDIR',
        type: IdentityProviders.IDIR,
      },
      {
        label: 'Basic BCeID',
        type: IdentityProviders.BCEIDBASIC,
      },
      {
        label: 'Business BCeID',
        type: IdentityProviders.BCEIDBUSINESS,
      },
    ],
    IDPS() {
      return IdentityProviders;
    },
  },
  methods: {
    ...mapActions('auth', ['login']),
    buttonEnabled(type) {
      return this.idpHint ? this.idpHint.includes(type) : false;
    },
  },
};
</script>
