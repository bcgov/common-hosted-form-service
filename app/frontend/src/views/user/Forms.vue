<script setup>
import FormsTable from '~/components/designer/FormsTable.vue';
import { useTenantStore } from '~/store/tenant';

const tenantStore = useTenantStore();
</script>

<template>
  <div>
    <BaseSecure v-if="tenantStore.isTenantFeatureEnabled">
      <FormsTable />
    </BaseSecure>
    <FormsTable v-else />
  </div>
</template>
