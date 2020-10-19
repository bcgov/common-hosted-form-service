<template>
  <div>
    <FormViewer
      :formId="f"
      :versionId="v"
      :submissionId="s"
    />
  </div>
</template>

<script>
import FormViewer from '@/components/designer/FormViewer.vue';

export default {
  name: 'FormView',
  props: {
    f: String,
    v: String,
    s: String,
  },
  components: {
    FormViewer,
  }
};
</script>
