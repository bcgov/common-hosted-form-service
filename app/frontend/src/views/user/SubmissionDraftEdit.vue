<template>
  <UserSubmission :saved="sv" :submissionId="s" :readOnly="false" />
</template>

<script>
import UserSubmission from '@/components/forms/submission/UserSubmission.vue';

export default {
  name: 'SubmissionDraftEdit',
  components: {
    UserSubmission,
  },
  props: {
    s: String,
    sv: Boolean,
  },
};
</script>
