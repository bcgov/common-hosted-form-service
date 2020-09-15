<template>
  <v-container>
    <FormViewer :formId="formId" :versionId="versionId" :submissionId="submissionId" :success="formSuccess"/>
  </v-container>
</template>

<script>
import FormViewer from '@/components/designer/FormViewer.vue';

export default {
  name: 'FormSubmissionView',
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
