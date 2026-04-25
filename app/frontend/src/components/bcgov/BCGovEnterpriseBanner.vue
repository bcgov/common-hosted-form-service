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

// Show the loader only when there is actually something to restore.
// Personal-CHEFS-only users (no tenant ever selected) get the Personal
// banner immediately — no loader flash. The conditions:
//   - explicit restore in flight (set by hydrator/fetchTenants), OR
//   - tenants are being fetched, no tenant resolved yet, AND a restore
//     token is sitting in storage (sessionStorage from session timeout
//     or localStorage from voluntary logout).
function hasPendingRestoreToken() {
  try {
    return !!(
      sessionStorage.getItem('tenantSessionRestore') ||
      localStorage.getItem('tenantLoginRestore')
    );
  } catch (e) {
    return false;
  }
}
const showRestoring = computed(
  () =>
    tenantStore.isRestoring ||
    (!selectedTenant.value && tenantStore.loading && hasPendingRestoreToken())
);
</script>

<template>
  <div
    v-if="
      authenticated && tenantStore.isTenantFeatureEnabled && !formSubmitMode
    "
    class="context-banner d-print-none"
    :class="
      showRestoring
        ? 'restoring-banner'
        : isEnterprise
        ? 'enterprise-banner'
        : 'personal-banner'
    "
    role="status"
    :aria-label="
      showRestoring
        ? 'Restoring tenant context'
        : isEnterprise
        ? `Enterprise CHEFS - Tenant: ${tenantName}`
        : 'Personal CHEFS'
    "
  >
    <div class="banner-content px-md-16 px-4">
      <template v-if="showRestoring">
        <v-progress-circular indeterminate size="16" width="2" class="mr-2" />
        <span class="banner-prefix">Restoring your tenant context&hellip;</span>
      </template>
      <template v-else-if="isEnterprise">
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

  &.restoring-banner {
    background-color: #e0e0e0;

    .banner-content {
      color: #333333;
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
