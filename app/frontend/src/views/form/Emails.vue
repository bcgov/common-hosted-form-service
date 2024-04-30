<script setup>
import { computed } from 'vue';
import EmailManagement from '~/components/forms/manage/EmailManagement.vue';
import { AppPermissions } from '~/utils/constants';

defineProps({
  f: {
    type: String,
    required: true,
  },
});

const APP_PERMS = computed(() => AppPermissions);
</script>

<template>
  <BaseSecure :permission="APP_PERMS.VIEWS_FORM_EMAILS">
    <EmailManagement :form-id="f" />
  </BaseSecure>
</template>
