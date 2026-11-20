<script setup>
import { useRoute } from 'vue-router';

import FormViewer from '~/components/designer/FormViewer.vue';
import FormSubmissionGate from '~/components/forms/FormSubmissionGate.vue';

defineProps({
  f: {
    type: String,
    required: true,
  },
});

const route = useRoute();
</script>

<template>
  <div>
    <FormSubmissionGate :key="f" :form-id="f" allow-offline>
      <FormViewer
        :key="`${route.query.editOffline ?? 'new'}-${f}-${
          route.query.fresh ?? ''
        }`"
        :form-id="f"
        display-title
      />
    </FormSubmissionGate>
  </div>
</template>
