<script setup>
import GroupManagement from '~/components/forms/manage/GroupManagement.vue';
import { useTenantStore } from '~/store/tenant';

defineProps({
  f: {
    type: String,
    required: true,
  },
});

const tenantStore = useTenantStore();
</script>

<template>
  <BaseSecure v-if="tenantStore.isTenantFeatureEnabled">
    <GroupManagement :form-id="f" />
  </BaseSecure>
  <GroupManagement v-else :form-id="f" />
</template>
