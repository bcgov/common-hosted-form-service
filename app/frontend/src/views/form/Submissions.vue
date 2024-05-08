<script setup>
import { computed } from 'vue';
import SubmissionsTable from '~/components/forms/SubmissionsTable.vue';
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
  <BaseSecure :permission="APP_PERMS.VIEWS_FORM_SUBMISSIONS">
    <SubmissionsTable :form-id="f" />
  </BaseSecure>
</template>
