<template>
  <div v-if="authenticated">
    <div v-if="isUser">
      <div v-if="admin && !isAdmin" class="text-center">
        <h1 class="my-8">{{ $t('trans.baseSecure.401UnAuthorized') }}(</h1>
        <p>{{ $t('trans.baseSecure.401UnAuthorizedErrMsg') }}</p>
      </div>
      <div
        v-else-if="idp && !idp.includes(identityProvider)"
        class="text-center"
      >
        <h1 class="my-8">{{ $t('trans.baseSecure.403Forbidden') }}(</h1>
        <p>
          {{
            $t('trans.baseSecure.403ErrorMsg', {
              idp: idp,
            })
          }}
        </p>
      </div>
      <slot v-else />
    </div>
    <!-- TODO: Figure out better way to alert when user lacks chefs user role -->
    <div v-else class="text-center">
      <h1 class="my-8">{{ $t('trans.baseSecure.401UnAuthorized') }}(</h1>
      <p>
        <span v-html="$t('trans.baseSecure.401ErrorMsg')"></span>
        <a :href="mailToLink">{{ contactInfo }}</a>
      </p>
      <router-link :to="{ name: 'About' }">
        <v-btn color="primary" class="about-btn" large>
          <v-icon left>home</v-icon>
          <span>{{ $t('trans.baseSecure.about') }}</span>
        </v-btn>
      </router-link>
    </div>
  </div>
  <div v-else class="text-center">
    <h1 class="my-8">{{ $t('trans.baseSecure.loginInfo') }}</h1>
    <v-btn
      v-if="keycloakReady"
      color="primary"
      class="login-btn"
      @click="login"
      large
    >
      <span>{{ $t('trans.baseSecure.login') }}</span>
    </v-btn>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'BaseSecure',
  props: {
    admin: {
      type: Boolean,
      default: false,
    },
    idp: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    ...mapGetters('auth', [
      'authenticated',
      'identityProvider',
      'isAdmin',
      'isUser',
      'keycloakReady',
    ]),
    mailToLink() {
      return `mailto:${
        process.env.VUE_APP_CONTACT
      }?subject=CHEFS%20Account%20Issue&body=Error%20accessing%20${encodeURIComponent(
        location
      )}.`;
    },
    contactInfo() {
      return process.env.VUE_APP_CONTACT;
    },
  },
  methods: mapActions('auth', ['login']),
};
</script>
