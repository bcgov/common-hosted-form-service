<script setup>
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';

defineProps({
  admin: {
    type: Boolean,
    default: false,
  },
  permission: {
    type: String,
    default: undefined,
  },
});

const authStore = useAuthStore();
const idpStore = useIdpStore();

const { authenticated, identityProvider, isAdmin, ready } =
  storeToRefs(authStore);

const { lang } = storeToRefs(useFormStore());
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
        permission &&
        !idpStore.hasPermission(identityProvider?.code, permission)
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
      @click="authStore.login"
    >
      <span :lang="lang">{{ $t('trans.baseSecure.login') }}</span>
    </v-btn>
  </div>
</template>
