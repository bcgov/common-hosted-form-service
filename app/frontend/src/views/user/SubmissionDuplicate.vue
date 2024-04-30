<script setup>
import UserDuplicateSubmission from '~/components/forms/submission/UserDuplicateSubmission.vue';

defineProps({
  s: {
    type: String,
    required: true,
  },
  f: {
    type: String,
    required: true,
  },
  sv: {
    type: Boolean,
  },
});
</script>

<template>
  <UserDuplicateSubmission
    :saved="sv"
    :submission-id="s"
    :form-id="f"
    :read-only="false"
  />
</template>
