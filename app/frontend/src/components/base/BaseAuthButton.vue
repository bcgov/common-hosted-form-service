<script>
import { mapState, mapActions } from 'pinia';
import { useRoute } from 'vue-router';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';

export default {
  computed: {
    ...mapState(useAuthStore, ['authenticated', 'ready']),
    ...mapState(useFormStore, ['lang']),
    hasLogin() {
      return useRoute()?.meta?.hasLogin;
    },
  },
  methods: {
    ...mapActions(useAuthStore, ['login', 'logout']),
  },
};
</script>

<template>
  <div v-if="ready" class="d-print-none">
    <v-btn
      v-if="authenticated"
      color="white"
      variant="outlined"
      @click="logout"
    >
      <span :lang="lang">{{ $t('trans.baseAuthButton.logout') }}</span>
    </v-btn>
    <v-btn v-else-if="hasLogin" color="white" variant="outlined" @click="login">
      <span :lang="lang">{{ $t('trans.baseAuthButton.login') }}</span>
    </v-btn>
  </div>
</template>
