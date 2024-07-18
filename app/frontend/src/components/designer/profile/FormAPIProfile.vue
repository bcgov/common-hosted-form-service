<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';

const { t, locale } = useI18n({ useScope: 'global' });

const formStore = useFormStore();
const apiRules = ref([(v) => v != null || t('trans.formProfile.selectAPIErr')]);
const form = computed(() => formStore.form);
const isRTL = computed(() => formStore.isRTL);
</script>

<template>
  <div class="ml-1 mb-4" :lang="locale">
    <span v-if="form.apiIntegration == null" class="text-danger"
      ><strong>*</strong></span
    >
    {{ $t('trans.formProfile.APIPrompt') }}
  </div>
  <v-radio-group
    v-model="form.apiIntegration"
    :rules="apiRules"
    data-test="api-radio"
  >
    <v-radio
      class="mb-4"
      :class="{ 'dir-rtl': isRTL }"
      :value="true"
      data-test="api-true"
    >
      <template #label>
        <span :class="{ 'mr-2': isRTL }" :lang="locale">
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
        <span :class="{ 'mr-2': isRTL }" :lang="locale">
          {{ $t('trans.formProfile.N') }}
        </span>
      </template></v-radio
    >
  </v-radio-group>
</template>
