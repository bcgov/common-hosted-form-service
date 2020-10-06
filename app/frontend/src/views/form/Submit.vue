<template>
  <div>
    <FormViewer :formId="f" :versionId="v" />
  </div>
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
    v: String,
  },
};
</script>
