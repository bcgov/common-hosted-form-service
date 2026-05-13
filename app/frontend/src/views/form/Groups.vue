<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import GroupManagement from '~/components/forms/manage/GroupManagement.vue';
import { useTenantStore } from '~/store/tenant';

defineProps({
  f: {
    type: String,
    required: true,
  },
});

const router = useRouter();
const tenantStore = useTenantStore();

onMounted(() => {
  if (!tenantStore.isTenantFeatureEnabled) {
    router.replace({ name: 'UserForms' });
  }
});
</script>

<template>
  <BaseSecure v-if="tenantStore.isTenantFeatureEnabled">
    <GroupManagement :form-id="f" />
  </BaseSecure>
</template>
