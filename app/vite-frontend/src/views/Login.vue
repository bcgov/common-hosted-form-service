<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useAuthStore } from '~/store/auth';
import { IdentityProviders } from '~/utils/constants';

const props = defineProps({
  idpHint: {
    type: Array,
    default: () => [
      IdentityProviders.IDIR,
      IdentityProviders.BCEIDBUSINESS,
      IdentityProviders.BCEIDBASIC,
    ],
  },
});

const authStore = useAuthStore();

if (props.idpHint && props.idpHint.length === 1)
  authStore.login(props.idpHint[0]);

const { authenticated, ready } = storeToRefs(authStore);

const buttons = computed(() => [
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
]);

const buttonEnabled = (type) => {
  return props.idpHint ? props.idpHint.includes(type) : false;
};
</script>

<template>
  <v-container class="text-center">
    <div v-if="ready && !authenticated">
      <h1 class="my-6">Authenticate with:</h1>
      <v-row v-for="button in buttons" :key="button.type" justify="center">
        <v-col v-if="buttonEnabled(button.type)" sm="3">
          <v-btn
            block
            color="primary"
            size="large"
            @click="authStore.login(button.type)"
          >
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
