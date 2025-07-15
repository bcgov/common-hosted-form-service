<script setup>
import { onMounted, ref } from 'vue';

import FormViewer from '~/components/designer/FormViewer.vue';
import { useFormStore } from '~/store/form';

const properties = defineProps({
  submissionId: {
    type: String,
    required: true,
  },
  formId: {
    type: String,
    required: true,
  },
  readOnly: { type: Boolean, default: true },
  saved: {
    type: Boolean,
    default: false,
  },
});

const loading = ref(true);

const formStore = useFormStore();

onMounted(async () => {
  await formStore.fetchSubmission({ submissionId: properties.submissionId });
  loading.value = false;
});
</script>

<template>
  <v-skeleton-loader :loading="loading" type="article" class="bgtrans">
    <FormViewer
      display-title
      :read-only="readOnly"
      :saved="saved"
      :submission-id="submissionId"
      :form-id="formId"
      :is-duplicate="true"
    />
  </v-skeleton-loader>
</template>
