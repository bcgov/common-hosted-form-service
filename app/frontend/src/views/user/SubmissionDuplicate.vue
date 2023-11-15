<template>
  <UserDuplicateSubmission
    :saved="sv"
    :submissionId="s"
    :formId="f"
    :readOnly="false"
  />
</template>

<script>
import UserDuplicateSubmission from '@/components/forms/submission/UserDuplicateSubmission.vue';
export default {
  name: 'SubmissionDuplicate',
  components: {
    UserDuplicateSubmission,
  },
  props: {
    s: String,
    f: String,
    sv: Boolean,
  },
};
</script>
