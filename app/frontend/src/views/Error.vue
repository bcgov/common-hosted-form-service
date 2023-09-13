<script>
import { mapActions, mapState } from 'pinia';
import { i18n } from '~/internationalization';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';

export default {
  props: {
    msg: {
      default: i18n.t('trans.error.somethingWentWrong'),
      type: String,
    },
  },
  computed: {
    ...mapState(useAuthStore, ['authenticated', 'ready']),
    ...mapState(useFormStore, ['lang']),
  },
  methods: mapActions(useAuthStore, ['logout']),
};
</script>

<template>
  <v-container class="text-center">
    <h1 class="my-6">{{ msg }}</h1>
    <div v-if="ready" class="d-print-none">
      <v-btn v-if="authenticated" color="primary" size="large" @click="logout">
        <span :lang="lang">{{ $t('trans.error.logout') }}</span>
      </v-btn>
    </div>
  </v-container>
</template>

<style lang="scss">
.v-btn > .v-btn__content {
  font-weight: bold !important;
}
</style>
