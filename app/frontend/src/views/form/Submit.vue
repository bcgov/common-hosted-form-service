<template>
  <FormViewer :formId="f" :bulkState="b" displayTitle />
</template>

<script>
import FormViewer from '@/components/designer/FormViewer.vue';

export default {
  name: 'FormSubmit',
  components: {
    FormViewer,
  },
  props: {
    f: String,
    b: String,
  },
};
</script>
