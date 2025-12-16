<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useFormStore } from '~/store/form';

import DirectPrintButton from '~/components/forms/DirectPrintButton.vue';
import PrintOptions from '~/components/forms/PrintOptions.vue';
import { printConfigService } from '~/services';

const properties = defineProps({
  submissionId: {
    type: String,
    default: '',
  },
  submission: {
    type: Object,
    default: undefined,
  },
  f: {
    type: String,
    default: '',
  },
});

const formStore = useFormStore();
const { form } = storeToRefs(formStore);

const printConfig = ref(null);
const loading = ref(true);
const useDirectPrint = computed(() => {
  return (
    printConfig.value &&
    printConfig.value.code === 'direct' &&
    printConfig.value.templateId
  );
});

// eslint-disable-next-line no-unused-vars
const formId = computed(() => (properties.f ? properties.f : form.value.id));

onMounted(async () => {
  // Try to fetch print config
  // Will fail gracefully if API doesn't exist yet (404 or network error)
  // In that case, we fall back to default PrintOptions behavior
  try {
    const response = await printConfigService.readPrintConfig(formId.value);
    printConfig.value = response.data;
  } catch {
    // Intentionally catch and ignore: API doesn't exist or config not found
    // This is expected behavior - gracefully fall back to PrintOptions (current behavior)
    // No error handling needed as fallback is the default behavior
    printConfig.value = null;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <!-- Show DirectPrintButton if config exists and is enabled -->
  <DirectPrintButton
    v-if="!loading && useDirectPrint"
    :submission-id="submissionId"
    :submission="submission"
    :f="f"
    :print-config="printConfig"
  />
  <!-- Fall back to default PrintOptions if no config or config disabled -->
  <PrintOptions
    v-else
    :submission-id="submissionId"
    :submission="submission"
    :f="f"
  />
</template>
