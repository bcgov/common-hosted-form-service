<template>
  <div v-if="authenticated">
    <div v-if="isUser">
      <div v-if="isAdmin">
        <slot />
      </div>
      <div v-else class="text-center">
        <h1 class="my-8">You are not authorized to use this feature.</h1>
        <router-link :to="{ name: 'About' }">
          <v-btn color="primary" class="about-btn" large>
            <v-icon left>home</v-icon>
            <span>About</span>
          </v-btn>
        </router-link>
      </div>
    </div>
    <!-- TODO: Figure out better way to alert when user lacks chefs user role -->
    <div v-else class="text-center">
      <h1 class="my-8">
        Your account is not set up correctly. Please contact support.
      </h1>
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
  computed: {
    ...mapGetters('auth', [
      'authenticated',
      'createLoginUrl',
      'isAdmin',
      'isUser',
      'keycloakReady',
    ]),
  },
  methods: {
    login() {
      if (this.keycloakReady) {
        window.location.replace(this.createLoginUrl());
        // window.location.replace(this.createLoginUrl({ idpHint: 'idir' }));
      }
    },
  },
};
</script>
