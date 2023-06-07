<script setup>
import FormSubmission from '~/components/forms/submission/UserSubmission.vue';

defineProps({
  s: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <FormSubmission :submission-id="s" />
</template>
