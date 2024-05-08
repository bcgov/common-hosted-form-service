<script setup>
import { computed } from 'vue';
import TeamManagement from '~/components/forms/manage/TeamManagement.vue';
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
  <BaseSecure :permission="APP_PERMS.VIEWS_FORM_TEAMS">
    <TeamManagement :form-id="f" />
  </BaseSecure>
</template>
