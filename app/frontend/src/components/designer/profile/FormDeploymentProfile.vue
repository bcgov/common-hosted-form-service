<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';
import { FormProfileValues } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

const formStore = useFormStore();
const form = computed(() => formStore.form);
const isRTL = computed(() => formStore.isRTL);
const FORM_PROFILE = computed(() => FormProfileValues);

const deploymentRules = ref([
  (v) => {
    return !!v || t('trans.formProfile.selectDeploymentErr');
  },
]);
</script>

<template>
  <div class="ml-1 mb-2" :lang="locale">
    <span v-if="!form.deploymentLevel" class="text-danger"
      ><strong>*</strong></span
    >
    {{ $t('trans.formProfile.deploymentPrompt') }}
  </div>
  <v-radio-group
    v-model="form.deploymentLevel"
    :mandatory="true"
    :rules="deploymentRules"
    data-test="deployment-radio"
  >
    <v-radio
      class="mb-4"
      :class="{ 'dir-rtl': isRTL }"
      :value="FORM_PROFILE.DEVELOPMENT"
      data-test="deployment-development"
      ><template #label>
        <span :class="{ 'mr-2': isRTL }" :lang="locale">
          {{ $t('trans.formProfile.development') }}
        </span>
      </template></v-radio
    >
    <v-radio
      class="mb-4"
      :class="{ 'dir-rtl': isRTL }"
      :value="FORM_PROFILE.TEST"
      data-test="deployment-test"
    >
      <template #label>
        <span :class="{ 'mr-2': isRTL }" :lang="locale">
          {{ $t('trans.formProfile.test') }}
        </span>
      </template>
    </v-radio>
    <v-radio
      class="mb-4"
      :class="{ 'dir-rtl': isRTL }"
      :value="FORM_PROFILE.PRODUCTION"
      data-test="deployment-prod"
    >
      <template #label>
        <span :class="{ 'mr-2': isRTL }" :lang="locale">
          {{ $t('trans.formProfile.production') }}
        </span>
      </template>
    </v-radio>
  </v-radio-group>
</template>
