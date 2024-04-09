<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { i18n } from '~/internationalization';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';

const properties = defineProps({
  text: {
    type: String,
    default: 'trans.error.somethingWentWrong',
  },
  translate: {
    type: Boolean,
    default: true,
  },
});

const authStore = useAuthStore();
const formStore = useFormStore();

const { authenticated, ready } = storeToRefs(authStore);
const { lang } = storeToRefs(formStore);

const TEXT = computed(() => {
  let text = properties.text;
  try {
    text = JSON.parse(text);
    text = i18n.t(text.text, text.options);
  } catch {
    // Can't parse JSON so it's probably already a locale
    text = properties.translate ? i18n.t(text) : text;
  }
  return text;
});
</script>

<template>
  <v-container class="text-center">
    <h1 class="my-6">{{ TEXT }}</h1>
    <div v-if="ready" class="d-print-none">
      <v-btn
        v-if="authenticated"
        color="primary"
        size="large"
        @click="authStore.logout"
      >
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
