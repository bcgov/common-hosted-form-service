<script setup>
import { ref, computed } from 'vue';
import { useFormStore } from '~/store/form';
import { i18n } from '~/internationalization';

const formStore = useFormStore();
const form = formStore.form;

const deploymentRules = ref([
  (v) => {
    return !!v || i18n.t('trans.formProfile.selectDeployment');
  },
]);

// Change this to constants somehow
const deploymentLevels = computed(() => [
  { id: 'development', text: i18n.t('trans.formProfile.development') },
  { id: 'test', text: i18n.t('trans.formProfile.test') },
  { id: 'production', text: i18n.t('trans.formProfile.production') },
]);
</script>

<template>
  <v-autocomplete
    v-model="form.deploymentLevel"
    :rules="deploymentRules"
    :label="$t('trans.formProfile.deploymentLevel')"
    :items="deploymentLevels"
    item-title="text"
    item-value="id"
  ></v-autocomplete>
</template>
