<script>
import { mapActions, mapState } from 'pinia';
import { i18n } from '~/internationalization';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

export default {
  props: {
    text: {
      default: 'trans.error.somethingWentWrong',
      type: String,
    },
  },
  computed: {
    ...mapState(useAuthStore, ['authenticated', 'ready']),
    ...mapState(useFormStore, ['lang']),
    ...mapActions(useNotificationStore, ['addNotification']),
    TEXT() {
      let text = this.text;
      try {
        text = JSON.parse(text);
        text = i18n.t(text.text, text.options);
      } catch {
        // Can't parse JSON so it's probably already a locale
        text = i18n.t(text);
      }
      return text;
    },
  },
  methods: mapActions(useAuthStore, ['logout']),
};
</script>

<template>
  <v-container class="text-center">
    <h1 class="my-6">{{ TEXT }}</h1>
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
