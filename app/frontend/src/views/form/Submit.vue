<script setup>
import FormViewer from '~/components/designer/FormViewer.vue';

defineProps({
  f: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <FormViewer :form-id="f" display-title />
</template>
