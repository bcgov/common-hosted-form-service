<script setup>
import UserSubmission from '~/components/forms/submission/UserSubmission.vue';

defineProps({
  s: {
    type: String,
    required: true,
  },
  sv: {
    type: Boolean,
  },
});
</script>

<template>
  <UserSubmission :saved="sv" :submission-id="s" :read-only="false" />
</template>
