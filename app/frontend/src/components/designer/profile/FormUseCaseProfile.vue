<script setup>
import { ref, computed } from 'vue';
import { useFormStore } from '~/store/form';
// import { FormProfileValues } from '~/utils/constants';
import { i18n } from '~/internationalization';

const formStore = useFormStore();

const useCaseRules = ref([
  (v) => {
    return !!v || i18n.t('trans.formProfile.selectUseCaseErr');
  },
]);

const form = computed(() => formStore.form);
const useCase = computed(() => [
  { id: 'application', text: i18n.t('trans.formProfile.application') },
  { id: 'collection', text: i18n.t('trans.formProfile.collection') },
  { id: 'registration', text: i18n.t('trans.formProfile.registration') },
  { id: 'report', text: i18n.t('trans.formProfile.report') },
  { id: 'feedback', text: i18n.t('trans.formProfile.feedback') },
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
