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
const useCase = computed(() => [
  {
    id: FormProfileValues.APPLICATION,
    text: i18n.t('trans.formProfile.application'),
  },
  {
    id: FormProfileValues.COLLECTION,
    text: i18n.t('trans.formProfile.collection'),
  },
  {
    id: FormProfileValues.REGISTRATION,
    text: i18n.t('trans.formProfile.registration'),
  },
  { id: FormProfileValues.REPORT, text: i18n.t('trans.formProfile.report') },
  {
    id: FormProfileValues.FEEDBACK,
    text: i18n.t('trans.formProfile.feedback'),
  },
]);
</script>

<template>
  <div class="ml-1 mb-4">
    {{ $t('trans.formProfile.useCasePrompt') }}
  </div>
  <v-autocomplete
    v-model="form.useCase"
    :label="$t('trans.formProfile.useCase')"
    :rules="useCaseRules"
    :items="useCase"
    item-title="text"
    item-value="id"
  ></v-autocomplete>
</template>
