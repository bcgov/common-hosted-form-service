<template>
  <div>
    <FormSubmission :submissionId="s" :readOnly="false" />
  </div>
</template>

<script>
import FormSubmission from '@/components/forms/submission/UserSubmission.vue';

export default {
  name: 'SubmissionDraftEdit',
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
