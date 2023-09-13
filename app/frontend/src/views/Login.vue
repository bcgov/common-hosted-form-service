<script>
import { mapActions, mapState } from 'pinia';

import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
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
    ...mapState(useFormStore, ['lang']),
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
      <h1 class="my-6" :lang="lang">
        {{ $t('trans.login.authenticateWith') }}
      </h1>
      <v-row v-for="button in buttons" :key="button.type" justify="center">
        <v-col v-if="buttonEnabled(button.type)" sm="3">
          <v-btn
            block
            color="primary"
            size="large"
            :data-test="button.type"
            @click="login(button.type)"
          >
            {{ button.label }}
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <div v-else-if="ready && authenticated">
      <h1 class="my-6" :lang="lang">
        {{ $t('trans.login.alreadyLoggedIn') }}
      </h1>
      <router-link :to="{ name: 'About' }">
        <v-btn class="ma-2" color="primary" size="large" :lang="lang">
          <v-icon start icon="mdi-home"></v-icon>
          <span :lang="lang">{{ $t('trans.login.about') }}</span>
        </v-btn>
      </router-link>
    </div>
    <div v-else>
      <h1 class="my-6">
        Identity and Access Management not ready, please contact technical
        support.
      </h1>
    </div>
  </v-container>
</template>

<style lang="scss">
.v-btn > .v-btn__content {
  font-weight: bold !important;
}
</style>
