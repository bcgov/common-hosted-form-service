<script setup>
import { onMounted, ref } from 'vue';

import FormViewer from '~/components/designer/FormViewer.vue';
import { useFormStore } from '~/store/form';

const properties = defineProps({
  submissionId: {
    type: String,
    required: true,
  },
  readOnly: { type: Boolean, default: true },
  saved: {
    type: Boolean,
    default: false,
  },
});

const formStore = useFormStore();

const loading = ref(true);

onMounted(async () => {
  await formStore.fetchSubmission({ submissionId: properties.submissionId });
  loading.value = false;
});
</script>

<template>
  <v-skeleton-loader :loading="loading" type="article">
    <v-container fluid
      ><FormViewer
        display-title
        :read-only="readOnly"
        :saved="saved"
        :submission-id="submissionId"
      />
    </v-container>
  </v-skeleton-loader>
</template>
