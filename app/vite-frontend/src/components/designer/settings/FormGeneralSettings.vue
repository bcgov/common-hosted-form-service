<script setup>
import { ref } from 'vue';
import BasePanel from '~/components/base/BasePanel.vue';

const name = ref(null);
const nameRules = [
  (v) => !!v || 'Form Title is required',
  (v) => (v && v.length <= 255) || 'Form Title must be 255 characters or less',
];
const description = ref(null);
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
    <template #title>Form Title</template>
    <v-text-field
      v-model="name"
      density="compact"
      solid
      variant="outlined"
      label="Form Title"
      data-test="text-name"
      :rules="nameRules"
    />

    <v-text-field
      v-model="description"
      density="compact"
      solid
      variant="outlined"
      label="Form Description"
      data-test="text-description"
      :rules="descriptionRules"
    />
  </BasePanel>
</template>
