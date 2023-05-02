<template>
  <UserDuplicateSubmission
    :saved="sv"
    :submission-id="s"
    :form-id="f"
    :read-only="false"
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
