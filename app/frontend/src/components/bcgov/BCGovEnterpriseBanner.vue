<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/auth';
import { useTenantStore } from '~/store/tenant';

defineProps({
  formSubmitMode: {
    type: Boolean,
    default: false,
  },
});

const { authenticated } = storeToRefs(useAuthStore());
const tenantStore = useTenantStore();
const { selectedTenant } = storeToRefs(tenantStore);

const isEnterprise = computed(() => !!selectedTenant.value);

const tenantName = computed(
  () => selectedTenant.value?.name || selectedTenant.value?.displayName || ''
);
</script>

<template>
  <div
    v-if="
      authenticated && tenantStore.isTenantFeatureEnabled && !formSubmitMode
    "
    class="context-banner d-print-none"
    :class="isEnterprise ? 'enterprise-banner' : 'personal-banner'"
    role="status"
    :aria-label="
      isEnterprise
        ? `Enterprise CHEFS - Tenant: ${tenantName}`
        : 'Personal CHEFS'
    "
  >
    <div class="banner-content px-md-16 px-4">
      <template v-if="isEnterprise">
        <span class="banner-prefix"
          >Enterprise CHEFS &ndash; Tenant:&nbsp;</span
        >
        <span class="banner-tenant">{{ tenantName }}</span>
      </template>
      <template v-else>
        <span class="banner-prefix">Personal CHEFS</span>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.context-banner {
  width: 100%;

  &.enterprise-banner {
    background-color: #fcba19;

    .banner-content {
      color: #003366;
    }
  }

  &.personal-banner {
    background-color: #898785;

    .banner-content {
      color: #ffffff;
    }
  }

  .banner-content {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    padding: 0.4rem 0;
    font-size: 0.9rem;
    font-weight: 700;
    min-height: 2rem;

    .banner-tenant {
      font-weight: 400;
    }

    @media (max-width: 600px) {
      font-size: 0.8rem;
      padding: 0.35rem 0;

      .banner-tenant {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: calc(100vw - 14rem);
      }
    }
  }
}
</style>
