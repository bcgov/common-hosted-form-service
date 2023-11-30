<script setup>
import { ref } from 'vue';
import { useFormStore } from '~/store/form';
import { i18n } from '~/internationalization';

const formStore = useFormStore();
const apiRules = ref([
  (v) => v != null || i18n.t('trans.formProfile.selectAPIErr'),
]);
const form = formStore.form;
const isRTL = formStore.isRTL;
const lang = formStore.lang;
</script>

<template>
  <div class="ml-1 mb-4">
    {{ $t('trans.formProfile.APIPrompt') }}
  </div>
  <v-radio-group v-model="form.apiIntegration" :rules="apiRules">
    <v-radio
      class="mb-4"
      :class="{ 'dir-rtl': isRTL }"
      :value="true"
      data-test="api-true"
    >
      <template #label>
        <span :class="{ 'mr-2': isRTL }" :lang="lang">
          {{ $t('trans.formProfile.Y') }}
        </span>
      </template></v-radio
    >
    <v-radio
      class="mb-4"
      :class="{ 'dir-rtl': isRTL }"
      :value="false"
      data-test="api-false"
    >
      <template #label>
        <span :class="{ 'mr-2': isRTL }" :lang="lang">
          {{ $t('trans.formProfile.N') }}
        </span>
      </template></v-radio
    >
  </v-radio-group>
</template>
