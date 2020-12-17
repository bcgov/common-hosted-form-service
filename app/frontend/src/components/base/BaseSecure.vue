<template>
  <div v-if="authenticated">
    <div v-if="isUser">
      <div v-if="admin && !isAdmin" class="text-center">
        <h1 class="my-8">401: Unauthorized. :(</h1>
        <p>You do not have permission to access this page.</p>
      </div>
      <div v-else>
        <slot />
      </div>
    </div>
    <!-- TODO: Figure out better way to alert when user lacks chefs user role -->
    <div v-else class="text-center">
      <h1 class="my-8">401: Unauthorized. :(</h1>
      <p>
        Your account is not set up correctly.<br />Please contact
        <a :href="mailToLink">NR.CommonServiceShowcase@gov.bc.ca</a>
      </p>
      <router-link :to="{ name: 'About' }">
        <v-btn color="primary" class="about-btn" large>
          <v-icon left>home</v-icon>
          <span>About</span>
        </v-btn>
      </router-link>
    </div>
  </div>
  <div v-else class="text-center">
    <h1 class="my-8">You must be logged in to use this feature.</h1>
    <v-btn
      v-if="keycloakReady"
      color="primary"
      class="login-btn"
      @click="login"
      large
    >
      <span>Login</span>
    </v-btn>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'BaseSecure',
  props: {
    admin: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapGetters('auth', [
      'authenticated',
      'createLoginUrl',
      'isAdmin',
      'isUser',
      'keycloakReady',
    ]),
    mailToLink() {
      return `mailto:NR.CommonServiceShowcase@gov.bc.ca?subject=CHEFS%20Account%20Issue&body=Error%20accessing%20${encodeURIComponent(
        location
      )}.`;
    },
  },
  methods: {
    login() {
      if (this.keycloakReady) {
        window.location.replace(this.createLoginUrl({ idpHint: 'idir' }));
      }
    },
  },
};
</script>
