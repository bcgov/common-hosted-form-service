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
    </div>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex';

import { IdentityProviders } from '@/utils/constants';

export default {
  name: 'Login',
  computed: {
    ...mapGetters('auth', ['authenticated', 'createLoginUrl', 'keycloakReady']),
  },
  data() {
    return {
      buttons: [
        {
          disabled: false,
          label: 'IDIR',
          type: IdentityProviders.IDIR,
        },
        {
          disabled: true,
          label: 'Basic BCeID',
          type: IdentityProviders.BCEIDBASIC,
        },
        {
          disabled: true,
          label: 'Business BCeID',
          type: IdentityProviders.BCEIDBUSINESS,
        },
      ],
    };
  },
  methods: {
    login(type) {
      if (this.keycloakReady) {
        window.location.replace(this.createLoginUrl({ idpHint: type }));
      }
    },
  },
};
</script>
