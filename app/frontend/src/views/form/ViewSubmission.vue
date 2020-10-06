<template>
  <div>
    <FormViewer
      :formId="f"
      :versionId="v"
      :submissionId="s"
      :success="success"
    />
  </div>
</template>

<script>
import FormViewer from '@/components/designer/FormViewer.vue';

export default {
  name: 'FormViewSubmission',
  props: {
    f: String,
    v: String,
    s: String,
    success: Boolean,
  },
  components: {
    FormViewer,
  },
};
</script>
