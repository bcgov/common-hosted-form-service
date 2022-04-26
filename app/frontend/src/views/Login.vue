<template>
  <v-container class="text-center">
    <div v-if="keycloakReady && !authenticated">
      <h1 class="my-6">Authenticate with:</h1>
      <v-row v-for="button in buttons" justify="center" :key="button.type">
        <v-col sm="3">
          <v-btn
            block
            color="primary"
            @click="login(button.type)"
            :disabled="button.disabled"
            large
          >
            <span>{{ button.label }}</span>
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <div v-else>
      <h1 class="my-6">Already logged in</h1>
      <router-link :to="{ name: 'About' }">
        <v-btn color="primary" large>
          <v-icon left>home</v-icon>
          <span>About</span>
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
      type: String,
      default: undefined,
    },
  },
  created() {
    // If component gets idpHint, invoke login flow via vuex
    if (this.idpHint) this.login(this.idpHint);
  },
  computed: {
    ...mapGetters('auth', ['authenticated', 'createLoginUrl', 'keycloakReady']),
    buttons: () => ([
      {
        disabled: false,
        label: 'IDIR',
        type: IdentityProviders.IDIR,
      },
      {
        disabled: false,
        label: 'Basic BCeID',
        type: IdentityProviders.BCEIDBASIC,
      },
      {
        disabled: false,
        label: 'Business BCeID',
        type: IdentityProviders.BCEIDBUSINESS,
      },
    ]),
  },
  methods: {
    ...mapActions('auth', ['login'])
  },
};
</script>
