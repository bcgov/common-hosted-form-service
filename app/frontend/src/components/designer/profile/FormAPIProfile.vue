<script setup>
import { ref, computed } from 'vue';
import { useFormStore } from '~/store/form';
import { i18n } from '~/internationalization';

const formStore = useFormStore();
const apiRules = ref([
  (v) => v != null || i18n.t('trans.formProfile.selectAPI'),
]);
const form = formStore.form;

// Change this to constants somehow
const apiIntegration = computed(() => [
  { id: true, text: i18n.t('trans.formProfile.Y') },
  { id: false, text: i18n.t('trans.formProfile.N') },
]);
</script>

<template>
  <div class="ml-1 mb-4">
    Specify if you intend to utilize the provided API for integration into a
    third-party application.
  </div>
  <v-autocomplete
    v-model="form.apiIntegration"
    :rules="apiRules"
    :label="$t('trans.formProfile.APIIntegration')"
    :items="apiIntegration"
    item-title="text"
    item-value="id"
  ></v-autocomplete>
</template>
