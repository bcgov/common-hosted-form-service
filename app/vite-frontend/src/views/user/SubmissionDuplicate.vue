<script>
import UserDuplicateSubmission from '~/components/forms/submission/UserDuplicateSubmission.vue';

export default {
  components: {
    UserDuplicateSubmission,
  },
  props: {
    s: {
      type: String,
      required: true,
    },
    f: {
      type: String,
      required: true,
    },
    sv: Boolean,
  },
};
</script>

<template>
  <UserDuplicateSubmission
    :saved="sv"
    :submission-id="s"
    :form-id="f"
    :read-only="false"
  />
</template>
