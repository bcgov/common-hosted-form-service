<template>
  <FormSubmission :submissionId="s" />
</template>

<script>
import FormSubmission from '@/components/forms/submission/UserSubmission.vue';

export default {
  name: 'UserSubmissionView',
  props: {
    s: {
      type: String,
      required: true,
    },
  },
  components: {
    FormSubmission,
  },
};
</script>
