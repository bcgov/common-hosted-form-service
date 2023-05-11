<template>
  <v-container class="text-center">
    <div v-if="keycloakReady && !authenticated">
      <h1 class="my-6">Authenticate with:</h1>
      <v-row v-for="button in buttons" :key="button.type" justify="center">
        <v-col v-if="buttonEnabled(button.type)" sm="3">
          <v-btn block color="primary" size="large" @click="login(button.type)">
            <span>{{ button.label }}</span>
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <div v-else>
      <h1 class="my-6">Already logged in</h1>
      <router-link :to="{ name: 'About' }">
        <v-btn color="primary" size="large">
          <v-icon start>home</v-icon>
          <span>About</span>
        </v-btn>
      </router-link>
    </div>
  </v-container>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import { IdentityProviders } from '@src/utils/constants';

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
  computed: {
    ...mapGetters('auth', ['authenticated', 'createLoginUrl', 'keycloakReady']),
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
  created() {
    // If component gets idpHint, invoke login flow via vuex
    if (this.idpHint && this.idpHint.length === 1) this.login(this.idpHint[0]);
  },
  methods: {
    ...mapActions('auth', ['login']),
    buttonEnabled(type) {
      return this.idpHint ? this.idpHint.includes(type) : false;
    },
  },
};
</script>
