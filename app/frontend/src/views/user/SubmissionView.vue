<template>
  <FormSubmission :submission-id="s" />
</template>

<script>
import FormSubmission from '@/components/forms/submission/UserSubmission.vue';

export default {
  name: 'UserSubmissionView',
  components: {
    FormSubmission,
  },
  props: {
    s: {
      type: String,
      required: true,
    },
  },
};
</script>
