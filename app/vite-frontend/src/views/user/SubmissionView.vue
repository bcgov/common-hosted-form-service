<script>
import FormSubmission from '~/components/forms/submission/UserSubmission.vue';

export default {
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

<template>
  <FormSubmission :submission-id="s" />
</template>
