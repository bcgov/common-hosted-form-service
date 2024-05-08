<script setup>
import { storeToRefs } from 'pinia';

import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';

defineProps({
  idpHint: {
    type: Array,
    default: () => [],
  },
});

const authStore = useAuthStore();
const formStore = useFormStore();
const idpStore = useIdpStore();

const { authenticated, ready } = storeToRefs(authStore);
const { lang } = storeToRefs(formStore);
const { loginButtons } = storeToRefs(idpStore);
</script>

<template>
  <v-container class="text-center">
    <div v-if="ready && !authenticated">
      <h1 class="my-6" :lang="lang">
        {{ $t('trans.login.authenticateWith') }}
      </h1>
      <v-row v-for="button in loginButtons" :key="button.code" justify="center">
        <v-col sm="3">
          <v-btn
            block
            color="primary"
            size="large"
            :data-test="button.code"
            @click="authStore.login(button.hint)"
          >
            {{ button.display }}
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
