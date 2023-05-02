<template>
  <UserSubmission :saved="sv" :submission-id="s" :read-only="false" />
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
