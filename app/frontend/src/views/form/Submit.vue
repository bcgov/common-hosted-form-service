<script>
import FormViewer from '~/components/designer/FormViewer.vue';

export default {
  components: {
    FormViewer,
  },
  props: {
    f: {
      type: String,
      required: true,
    },
  },
};
</script>

<template>
  <FormViewer :form-id="f" display-title />
</template>
