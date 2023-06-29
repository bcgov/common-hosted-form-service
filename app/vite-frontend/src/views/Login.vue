<script>
import { mapActions, mapState } from 'pinia';

import { useAuthStore } from '~/store/auth';
import { IdentityProviders } from '~/utils/constants';

export default {
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
    ...mapState(useAuthStore, ['authenticated', 'createLoginUrl', 'ready']),
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
    ...mapActions(useAuthStore, ['login']),
    buttonEnabled(type) {
      return this.idpHint ? this.idpHint.includes(type) : false;
    },
  },
};
</script>

<template>
  <v-container class="text-center">
    <div v-if="ready && !authenticated">
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
        <v-btn class="ma-2" color="primary" size="large">
          <v-icon start icon="mdi-home"></v-icon>
          About
        </v-btn>
      </router-link>
    </div>
  </v-container>
</template>
