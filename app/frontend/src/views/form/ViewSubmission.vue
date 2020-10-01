<template>
  <div>
    <FormViewer :formId="formId" :versionId="versionId" :submissionId="submissionId" :success="formSuccess"/>
  </div>
</template>

<script>
import FormViewer from '@/components/designer/FormViewer.vue';

export default {
  name: 'FormViewSubmission',
  props: ['formId', 'versionId', 'submissionId'],
  components: {
    FormViewer,
  },
  computed: {
    formSuccess() {
      return this.$route.query.success;
    }
  },
};
</script>
