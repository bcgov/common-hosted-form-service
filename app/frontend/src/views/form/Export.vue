<script setup>
import { computed } from 'vue';
import ExportSubmissions from '~/components/forms/ExportSubmissions.vue';
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
  <BaseSecure :permission="APP_PERMS.VIEWS_FORM_EXPORT">
    <ExportSubmissions :form-id="f" />
  </BaseSecure>
</template>
