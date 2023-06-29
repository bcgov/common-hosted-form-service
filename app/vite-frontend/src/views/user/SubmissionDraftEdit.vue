<script>
import UserSubmission from '~/components/forms/submission/UserSubmission.vue';

export default {
  components: {
    UserSubmission,
  },
  props: {
    s: {
      type: String,
      required: true,
    },
    sv: Boolean,
  },
};
</script>

<template>
  <UserSubmission :saved="sv" :submission-id="s" :read-only="false" />
</template>
