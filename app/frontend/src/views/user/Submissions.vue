<script setup>
import { computed } from 'vue';
import MySubmissionsTable from '~/components/forms/submission/MySubmissionsTable.vue';
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
  <BaseSecure :permission="APP_PERMS.VIEWS_USER_SUBMISSIONS">
    <MySubmissionsTable :form-id="f" />
  </BaseSecure>
</template>
