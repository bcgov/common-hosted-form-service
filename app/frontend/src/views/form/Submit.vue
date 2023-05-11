<template>
  <FormViewer :form-id="f" display-title />
</template>

<script>
import FormViewer from '@src/components/designer/FormViewer.vue';

export default {
  name: 'FormSubmit',
  components: {
    FormViewer,
  },
  props: {
    f: String,
  },
};
</script>
