<script setup>
import { computed } from 'vue';
import FormSubmission from '~/components/forms/FormSubmission.vue';
import { AppPermissions } from '~/utils/constants';

defineProps({
  s: {
    type: String,
    required: true,
  },
});

const APP_PERMS = computed(() => AppPermissions);
</script>

<template>
  <BaseSecure :permission="APP_PERMS.VIEWS_FORM_VIEW">
    <FormSubmission :submission-id="s" />
  </BaseSecure>
</template>
