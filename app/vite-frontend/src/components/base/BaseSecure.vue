<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useAuthStore } from '~/store/auth';
defineProps({
  admin: {
    type: Boolean,
    default: false,
  },
  idp: {
    type: Array,
    default: () => [],
  },
});

const authStore = useAuthStore();

const { authenticated, identityProvider, ready } = storeToRefs(authStore);

const mailToLink = computed(
  () =>
    `mailto:${
      import.meta.env.VITE_CONTACT
    }?subject=CHEFS%20Account%20Issue&body=Error%20accessing%20${encodeURIComponent(
      location
    )}`
);

const contactInfo = computed(() => import.meta.env.VITE_CONTACT);
</script>

<template>
  <div v-if="authenticated">
    <div v-if="authStore.isUser">
      <div v-if="admin && !authStore.isAdmin" class="text-center">
        <h1 class="my-8">401: Unauthorized. :(</h1>
        <p>You do not have permission to access this page.</p>
      </div>
      <div
        v-else-if="idp && !idp.includes(identityProvider)"
        class="text-center"
      >
        <h1 class="my-8">403: Forbidden. :(</h1>
        <p>This page requires {{ idp }} authentication.</p>
      </div>
      <slot v-else />
    </div>
    <!-- TODO: Figure out better way to alert when user lacks chefs user role -->
    <div v-else class="text-center">
      <h1 class="my-8">401: Unauthorized. :(</h1>
      <p>
        Your account is not set up correctly.<br />Please contact
        <a :href="mailToLink">{{ contactInfo }}</a>
      </p>
      <router-link :to="{ name: 'About' }">
        <v-btn color="primary" class="about-btn" size="large">
          <v-icon start icon="mdi:mdi-home"></v-icon>
          <span>About</span>
        </v-btn>
      </router-link>
    </div>
  </div>
  <div v-else class="text-center">
    <h1 class="my-8">You must be logged in to use this feature.</h1>
    <v-btn
      v-if="ready"
      color="primary"
      class="login-btn"
      size="large"
      @click="login"
    >
      <span>Login</span>
    </v-btn>
  </div>
</template>
