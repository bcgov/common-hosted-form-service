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

const form = formStore.form;
const isRTL = formStore.isRTL;
const lang = formStore.lang;

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
