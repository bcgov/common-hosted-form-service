<script setup>
import { ref, computed } from 'vue';
import { useFormStore } from '~/store/form';
import { FormProfileValues } from '~/utils/constants';
import { i18n } from '~/internationalization';

const formStore = useFormStore();

const useCaseRules = ref([
  (v) => {
    return !!v || i18n.t('trans.formProfile.selectUseCaseErr');
  },
]);

const form = computed(() => formStore.form);
const lang = computed(() => formStore.lang);
const isRTL = computed(() => formStore.isRTL);

const useCase = computed(() => {
  return FormProfileValues.USE_CASE.map((useCase) => ({
    id: useCase.id,
    text: i18n.t(`trans.formProfile.${useCase.id}`),
  }));
});
</script>

<template>
  <div class="ml-1 mb-4" :lang="lang">
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
        <span :lang="lang">{{ $t('trans.formProfile.useCaseToolTip') }}</span>
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
