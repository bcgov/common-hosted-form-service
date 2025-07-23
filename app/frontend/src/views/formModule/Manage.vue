<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import FormModuleManageLayout from '~/components/formModule/manage/ManageLayout.vue';
import { useAuthStore } from '~/store/auth';
import { AppPermissions } from '~/utils/constants';

defineProps({
  fm: {
    type: String,
    required: true,
  },
});

const authStore = useAuthStore();
const { isAdmin } = storeToRefs(authStore);

const APP_PERMS = computed(() => AppPermissions);
</script>

<template>
  <BaseSecure :admin="isAdmin" :permission="APP_PERMS.VIEWS_ADMIN">
    <FormModuleManageLayout :fm="fm" />
  </BaseSecure>
</template>
