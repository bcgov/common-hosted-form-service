<script setup>
import { storeToRefs } from 'pinia';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';

const formStore = useFormStore();

const { form } = storeToRefs(formStore);

const nameRules = [
  (v) => !!v || 'Form Title is required',
  (v) => (v && v.length <= 255) || 'Form Title must be 255 characters or less',
];
const descriptionRules = [
  (v) => {
    if (v) {
      return (
        v.length <= 255 || 'Form Description must be 255 characters or less'
      );
    } else return true;
  },
];
</script>

<template>
  <BasePanel class="fill-height">
    <template #title>{{ $t('trans.formSettings.formTitle') }}</template>
    <v-text-field
      v-model="form.name"
      density="compact"
      solid
      variant="outlined"
      :label="$t('trans.formSettings.formTitle')"
      data-test="text-name"
      :rules="nameRules"
    />

    <v-text-field
      v-model="form.description"
      density="compact"
      solid
      variant="outlined"
      :label="$t('trans.formSettings.formDescription')"
      data-test="text-description"
      :rules="descriptionRules"
    />
  </BasePanel>
</template>
