<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';
import { FormProfileValues } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

const formStore = useFormStore();

const useCaseRules = ref([
  (v) => {
    return !!v || t('trans.formProfile.selectUseCaseErr');
  },
]);

const form = computed(() => formStore.form);
const isRTL = computed(() => formStore.isRTL);

const useCase = computed(() => {
  return FormProfileValues.USE_CASE.map((useCase) => ({
    id: useCase.id,
    text: t(`trans.formProfile.${useCase.id}`),
  }));
});
</script>

<template>
  <div class="ml-1 mb-4" :lang="locale">
    <span v-if="!form.useCase" class="text-danger"><strong>*</strong></span>
    {{ $t('trans.formProfile.useCasePrompt') }}
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-icon
          color="primary"
          class="ml-1"
          :class="{ 'mr-2': isRTL }"
          v-bind="props"
          icon="mdi:mdi-help-circle-outline"
        />
      </template>
      <span>
        <span :lang="locale">{{ $t('trans.formProfile.useCaseToolTip') }}</span>
      </span>
    </v-tooltip>
  </div>
  <v-autocomplete
    v-model="form.useCase"
    :class="{ label: isRTL }"
    :label="$t('trans.formProfile.useCase')"
    :rules="useCaseRules"
    :items="useCase"
    item-title="text"
    item-value="id"
    data-test="case-select"
  ></v-autocomplete>
</template>
