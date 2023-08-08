<template>
  <v-container class="text-center">
    <h1 class="my-6">{{ msg }}</h1>
    <div v-if="keycloakReady" class="d-print-none">
      <v-btn v-if="authenticated" color="primary" large @click="logout">
        <span :lang="lang">{{ $t('trans.error.logout') }}</span>
      </v-btn>
    </div>
  </v-container>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import i18n from '@/internationalization';
export default {
  name: 'Error',
  props: {
    msg: {
      default: i18n.t('trans.error.somethingWentWrong'),
      type: String,
    },
  },
  computed: {
    ...mapGetters('auth', ['authenticated', 'keycloakReady']),
    ...mapGetters('form', ['lang']),
  },
  methods: mapActions('auth', ['logout']),
};
</script>
