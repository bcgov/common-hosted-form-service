<script setup>
import { ref, computed } from 'vue';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';
import { FormProfileValues } from '~/utils/constants';
import { i18n } from '~/internationalization';

const formStore = useFormStore();

const useCaseRules = ref([
  (v) => {
    return !!v || i18n.t('trans.formProfile.selectUseCase');
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
        $t('trans.formProfile.useCaseType')
      }}</span></template
    >

    <v-radio-group v-model="form.useCase" :rules="useCaseRules">
      <v-radio
        class="mb-4"
        :class="{ 'dir-rtl': isRTL }"
        :value="FORM_PROFILE.FEEDBACK"
      >
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.formProfile.feedback') }}
          </span>
        </template>
      </v-radio>

      <v-radio
        class="mb-4"
        :class="{ 'dir-rtl': isRTL }"
        :value="FORM_PROFILE.APPLICATION"
      >
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.formProfile.application') }}
          </span>
        </template>
      </v-radio>

      <v-radio
        class="mb-4"
        :class="{ 'dir-rtl': isRTL }"
        :value="FORM_PROFILE.COLLECTION"
      >
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.formProfile.collection') }}
          </span>
        </template>
      </v-radio>

      <v-radio
        class="mb-4"
        :class="{ 'dir-rtl': isRTL }"
        :value="FORM_PROFILE.REPORT"
      >
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.formProfile.report') }}
          </span>
        </template>
      </v-radio>

      <v-radio
        class="mb-4"
        :class="{ 'dir-rtl': isRTL }"
        :value="FORM_PROFILE.REGISTRATION"
      >
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.formProfile.registration') }}
          </span>
        </template>
      </v-radio>
    </v-radio-group>
  </BasePanel>
</template>
