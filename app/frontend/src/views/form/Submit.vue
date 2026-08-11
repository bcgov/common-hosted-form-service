<script setup>
import { useRoute } from 'vue-router';

import FormViewer from '~/components/designer/FormViewer.vue';

defineProps({
  f: {
    type: String,
    required: true,
  },
});

const route = useRoute();
</script>

<template>
  <FormViewer
    :key="`${route.query.editOffline ?? 'new'}-${route.query.f ?? ''}`"
    :form-id="f"
    display-title
  />
</template>
