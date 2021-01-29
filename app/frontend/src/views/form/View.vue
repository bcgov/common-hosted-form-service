<template>
  <div>
    <FormSubmission :submissionId="s" />
  </div>
</template>

<script>
import FormSubmission from '@/components/forms/FormSubmission.vue';

export default {
  name: 'FormView',
  props: {
    s: String,
  },
  components: {
    FormSubmission,
  },
};
</script>
