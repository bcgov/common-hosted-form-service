<script setup>
import { ref, computed } from 'vue';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';
import { FormProfileValues } from '~/utils/constants';
import { i18n } from '~/internationalization';

const formStore = useFormStore();

const deploymentRequiredRules = ref([
  (v) => {
    return !!v || i18n.t('trans.formProfile.selectDeployment');
  },
]);
const form = computed(() => formStore.form);
const lang = computed(() => formStore.lang);
const isRTL = computed(() => formStore.isRTL);
const FORM_PROFILE = computed(() => FormProfileValues);
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="lang">{{
        $t('trans.formProfile.deploymentLevel')
      }}</span></template
    >

    <v-radio-group
      v-model="form.deploymentLevel"
      :mandatory="true"
      :rules="deploymentRequiredRules"
    >
      <v-radio
        class="mb-4"
        :class="{ 'dir-rtl': isRTL }"
        :value="FORM_PROFILE.DEVELOPMENT"
      >
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.formProfile.development') }}
          </span>
        </template>
      </v-radio>

      <v-radio
        class="mb-4"
        :class="{ 'dir-rtl': isRTL }"
        :value="FORM_PROFILE.TEST"
      >
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.formProfile.test') }}
          </span>
        </template>
      </v-radio>

      <v-radio
        class="mb-4"
        :class="{ 'dir-rtl': isRTL }"
        :value="FORM_PROFILE.PRODUCTION"
      >
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.formProfile.production') }}
          </span>
        </template>
      </v-radio>
    </v-radio-group>
  </BasePanel>
</template>
