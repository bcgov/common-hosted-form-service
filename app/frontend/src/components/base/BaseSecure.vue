<script>
import { mapActions, mapState } from 'pinia';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';

export default {
  props: {
    admin: {
      type: Boolean,
      default: false,
    },
    permission: {
      type: String,
      default: undefined,
    },
  },
  computed: {
    ...mapState(useAuthStore, [
      'authenticated',
      'identityProvider',
      'isAdmin',
      'ready',
    ]),
    ...mapState(useFormStore, ['lang']),
    ...mapState(useIdpStore, ['hasPermission']),
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
  methods: {
    ...mapActions(useAuthStore, ['login']),
  },
};
</script>

<template>
  <div v-if="authenticated">
    <div v-if="admin && !isAdmin" class="text-center">
      <h1 class="my-8" :lang="lang">
        {{ $t('trans.baseSecure.401UnAuthorized') }}
      </h1>
      <p :lang="lang">
        {{ $t('trans.baseSecure.401UnAuthorizedErrMsg') }}
      </p>
    </div>
    <div
      v-else-if="
        permission && !hasPermission(identityProvider?.code, permission)
      "
      class="text-center"
    >
      <h1 class="my-8" :lang="lang">
        {{ $t('trans.baseSecure.403Forbidden') }}
      </h1>
      <p :lang="lang">
        {{
          $t('trans.baseSecure.403ErrorMsg', {
            idp: permission,
          })
        }}
      </p>
    </div>
    <slot v-else />
  </div>
  <div v-else class="text-center">
    <h1 class="my-8" :lang="lang">
      {{ $t('trans.baseSecure.loginInfo') }}
    </h1>
    <v-btn
      v-if="ready"
      data-test="login-btn"
      color="primary"
      class="login-btn"
      size="large"
      @click="login"
    >
      <span :lang="lang">{{ $t('trans.baseSecure.login') }}</span>
    </v-btn>
  </div>
</template>
