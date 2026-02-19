<template>
  <!-- Only show dropdown if user has tenants -->
  <div
    v-if="tenantStore.hasTenants || tenantStore.loading"
    class="tenant-dropdown-container"
  >
    <!-- Dropdown input -->
    <v-select
      id="tenant-select"
      ref="selectRef"
      v-model="selectedValue"
      :items="allTenantOptions"
      :loading="tenantStore.loading"
      :disabled="tenantStore.loading"
      :menu-props="{ closeOnClick: false }"
      :placeholder="$t('trans.tenantDropdown.placeholder')"
      item-title="name"
      item-value="id"
      :no-data-text="$t('trans.tenantDropdown.noDataText')"
      prepend-inner-icon="mdi:mdi-home-account"
      variant="outlined"
      density="compact"
      hide-details
      class="tenant-select"
      @click="handleDropdownOpen"
      @focus="handleDropdownOpen"
      @update:model-value="handleTenantChange"
    >
      <!-- Custom selection template -->
      <template #selection="{ item }">
        <span class="selected-tenant">{{ item.title }}</span>
      </template>
      <!-- CSTAR Link at bottom of dropdown -->
      <template #append-item>
        <v-divider />
        <v-list-item class="cstar-link-item" @click="goToCSTAR">
          <template #prepend>
            <v-icon size="small">mdi-open-in-new</v-icon>
          </template>
          <span :lang="locale">{{ $t('trans.tenantDropdown.goToCstar') }}</span>
        </v-list-item>
      </template>

      <!-- Custom no-data state with CSTAR link -->
      <template #no-data>
        <div class="no-data-wrapper">
          <p class="no-data-message" :lang="locale">
            {{ $t('trans.tenantDropdown.noTenantsAvailable') }}
          </p>
          <p class="no-data-subtext" :lang="locale">
            {{ $t('trans.tenantDropdown.manageTenantsIn') }}
            <a href="#" class="cstar-link" @click.prevent="goToCSTAR">{{
              $t('trans.tenantDropdown.cstar')
            }}</a>
          </p>
        </div>
      </template>
    </v-select>

    <!-- Info tooltip icon -->
    <v-tooltip location="bottom" max-width="300">
      <template #activator="{ props }">
        <v-icon
          v-bind="props"
          size="small"
          class="info-icon"
          :aria-label="$t('trans.tenantDropdown.infoTooltip')"
          >mdi-information-outline</v-icon
        >
      </template>
      <span :lang="locale">{{ $t('trans.tenantDropdown.infoTooltip') }}</span>
    </v-tooltip>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '~/store/app';
import { useTenantStore } from '~/store/tenant';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

const { locale } = useI18n({ useScope: 'global' });

const router = useRouter();
const appStore = useAppStore();
const tenantStore = useTenantStore();
const formStore = useFormStore();
const notificationStore = useNotificationStore();
const selectedValue = ref(null);
const selectRef = ref(null);

// Build dropdown items: Classic CHEFS (value=null) is always the first entry
const allTenantOptions = computed(() => [
  { id: null, name: 'Classic CHEFS', value: null },
  ...tenantStore.tenantsList,
]);

// Handle tenant selection change
const handleTenantChange = async (value) => {
  try {
    if (value) {
      const tenant = tenantStore.getTenantById(value);
      if (tenant) {
        tenantStore.selectTenant(tenant);
        selectedValue.value = value;
      }
    } else {
      tenantStore.clearSelectedTenant();
      selectedValue.value = null;
    }

    // Fetch forms for the selected tenant (or Classic CHEFS if no tenant)
    // Form store will automatically handle errors and show notifications
    await formStore.getFormsForCurrentUser();

    // Navigate to forms list page
    await router.push({ name: 'UserForms' });
  } catch (error) {
    // Note: formStore.getFormsForCurrentUser() doesn't throw errors,
    // but router.push might fail. Only show error if navigation fails.
    notificationStore.addNotification({
      text: 'Error navigating to forms. Please try again.',
      consoleError: error,
    });
  }
};

// Navigate to CSTAR external system
const goToCSTAR = () => {
  const cstarUrl =
    appStore.config?.cstarBaseUrl ||
    'https://cstar-dev.apps.silver.devops.gov.bc.ca';
  window.open(cstarUrl, '_blank', 'noopener,noreferrer');
};

// Lazy load tenants when dropdown is opened (if not already loaded)
const handleDropdownOpen = async () => {
  // Only fetch if we don't have tenants yet
  if (tenantStore.tenants.length === 0 && !tenantStore.loading) {
    await tenantStore.fetchTenants();
  }
};

// Initialize - load from localStorage AND fetch tenants
onMounted(async () => {
  // Load persisted tenant selection from localStorage (no API call)
  tenantStore.initializeStore();

  // Fetch available tenants (API call)
  // This is safe now because BCGovHeader only shows this component on allowed routes
  if (tenantStore.tenants.length === 0) {
    await tenantStore.fetchTenants();
  }

  // Set selected value from store if tenant is selected
  if (tenantStore.selectedTenant) {
    selectedValue.value = tenantStore.selectedTenant.id;
  }
});

// Watch for changes in tenants to update selected value
watch(
  () => tenantStore.selectedTenant,
  (newTenant) => {
    selectedValue.value = newTenant ? newTenant.id : null;
  }
);
</script>

<style scoped lang="scss">
$mobile-breakpoint: 600px;

.tenant-dropdown-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  width: auto;

  @media (max-width: $mobile-breakpoint) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    width: 100%;
  }
}

.tenant-select {
  width: 280px;
  flex-shrink: 0;

  @media (max-width: $mobile-breakpoint) {
    width: 100%;
  }

  :deep(.v-field__input) {
    opacity: 1 !important;
    font-size: 0.95rem;
  }

  :deep(.v-icon) {
    opacity: 1;
  }

  /* Ensure placeholder is visible */
  :deep(.v-field__input::placeholder) {
    opacity: 1 !important;
    color: rgba(0, 0, 0, 0.38) !important;
  }
}

.info-icon {
  color: #fcba19;
  flex-shrink: 0;
  cursor: default;
}

.selected-tenant {
  font-size: 0.95rem;
  display: block;
  line-height: 1.5;
  margin: 0;
  padding: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
