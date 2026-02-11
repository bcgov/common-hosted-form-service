<script setup>
import { computed, ref, watch } from 'vue';
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

// Watch for formId to become available before making API call
const fetchPrintConfig = async (currentFormId) => {
  // Only make API call if formId is available (not empty)
  if (!currentFormId) {
    return;
  }

  // Try to fetch print config
  // Will fail gracefully if API doesn't exist yet (404 or network error)
  // In that case, we fall back to default PrintOptions behavior
  try {
    const response = await printConfigService.readPrintConfig(currentFormId);
    printConfig.value = response.data;
  } catch (error) {
    // Intentionally catch and ignore: API doesn't exist or config not found
    // This is expected behavior - gracefully fall back to PrintOptions (current behavior)
    // Only ignore 404 (not found) or network errors; re-throw unexpected errors
    const isNotFound = error?.response?.status === 404;
    const isNetworkError = !error?.response;
    if (isNotFound || isNetworkError) {
      printConfig.value = null;
    } else {
      // Re-throw unexpected errors
      throw error;
    }
  } finally {
    loading.value = false;
  }
};

// Watch formId and fetch print config when it becomes available
let hasFetched = false;
watch(
  formId,
  (newFormId) => {
    // Only fetch once when formId becomes available (not empty)
    if (newFormId && !hasFetched) {
      hasFetched = true;
      fetchPrintConfig(newFormId);
    }
  },
  { immediate: true }
);
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
