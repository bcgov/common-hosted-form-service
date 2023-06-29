<script>
import { mapActions, mapState } from 'pinia';
import { useAuthStore } from '~/store/auth';

export default {
  props: {
    admin: {
      type: Boolean,
      required: false,
    },
    idp: {
      type: Array,
      default: undefined,
    },
  },
  computed: {
    ...mapState(useAuthStore, [
      'authenticated',
      'identityProvider',
      'isAdmin',
      'isUser',
      'ready',
    ]),
    mailToLink() {
      return `mailto:${
        import.meta.env.VITE_CONTACT
      }?subject=CHEFS%20Account%20Issue&body=Error%20accessing%20${encodeURIComponent(
        location
      )}.`;
    },
    contactInfo() {
      return import.meta.env.VITE_CONTACT;
    },
  },
  methods: mapActions(useAuthStore, ['login']),
};
</script>

<template>
  <div v-if="authenticated">
    <div v-if="isUser">
      <div v-if="admin && !isAdmin" class="text-center">
        <h1 class="my-8">{{ $t('trans.baseSecure.401UnAuthorized') }}(</h1>
        <p>{{ $t('trans.baseSecure.401UnAuthorizedErrMsg') }}</p>
      </div>
      <div
        v-else-if="idp && idp.length > 0 && !idp.includes(identityProvider)"
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
        <span v-html="$t('trans.baseSecure.401ErrorMsg')"> </span>
        <a :href="mailToLink">{{ contactInfo }}</a>
      </p>
      <router-link :to="{ name: 'About' }">
        <v-btn color="primary" class="about-btn" size="large">
          <v-icon start icon="mdi:mdi-home"></v-icon>
          <span>{{ $t('trans.baseSecure.about') }}</span>
        </v-btn>
      </router-link>
    </div>
  </div>
  <div v-else class="text-center">
    <h1 class="my-8">{{ $t('trans.baseSecure.loginInfo') }}</h1>
    <v-btn
      v-if="ready"
      data-test="login-btn"
      color="primary"
      class="login-btn"
      size="large"
      @click="login"
    >
      <span>{{ $t('trans.baseSecure.login') }}</span>
    </v-btn>
  </div>
</template>
