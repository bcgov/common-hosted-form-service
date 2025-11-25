<template>
  <!-- Only show dropdown if user has tenants -->
  <div
    v-if="tenantStore.hasTenants || tenantStore.loading"
    class="tenant-dropdown-container"
  >
    <!-- Label with info icon -->
    <div class="tenant-label-wrapper">
      <v-icon
        size="small"
        class="info-icon"
        title="Enterprise CHEFS is the new version of CHEFS that supports multi-tenant access. Selecting your tenant will take you there automatically."
        >mdi-information-outline</v-icon
      >
      <label for="tenant-select" class="tenant-label"
        >Select tenant (opens in Enterprise CHEFS)
      </label>
    </div>

    <!-- Dropdown input -->
    <div class="tenant-input-wrapper">
      <v-select
        id="tenant-select"
        v-model="selectedValue"
        :items="allTenantOptions"
        :loading="tenantStore.loading"
        :disabled="tenantStore.loading"
        placeholder="Select from available tenants"
        item-title="name"
        item-value="id"
        no-data-text="No tenants found"
        variant="outlined"
        density="comfortable"
        class="tenant-select"
        @update:model-value="handleTenantChange"
      >
        <!-- CSTAR Link and Classic CHEFS at bottom of dropdown -->
        <template #append-item>
          <v-divider />
          <!-- Classic CHEFS link - only show when tenant is selected -->
          <v-list-item
            v-if="tenantStore.selectedTenant"
            class="classic-chefs-link-item"
            @click="switchToClassicChefs"
          >
            <template #prepend>
              <v-icon size="small">mdi-swap-horizontal</v-icon>
            </template>
            <span>Switch to Classic CHEFS</span>
          </v-list-item>
          <v-divider v-if="tenantStore.selectedTenant" />
          <v-list-item class="cstar-link-item" @click="goToCSTAR">
            <template #prepend>
              <v-icon size="small">mdi-open-in-new</v-icon>
            </template>
            <span>Go to CSTAR (Connected Services, Team Access and Roles)</span>
          </v-list-item>
        </template>

        <!-- Custom no-data state with CSTAR link -->
        <template #no-data>
          <div class="no-data-wrapper">
            <p class="no-data-message">No tenants available</p>
            <p class="no-data-subtext">
              Manage tenants in
              <a href="#" class="cstar-link" @click.prevent="goToCSTAR"
                >CSTAR</a
              >
            </p>
          </div>
        </template>
      </v-select>
    </div>

    <!-- Helper Text (below input) -->
    <div class="tenant-helper-text">
      Manage in
      <a href="#" class="helper-link" @click.prevent="goToCSTAR">CSTAR</a>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTenantStore } from '~/store/tenant';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

const router = useRouter();
const tenantStore = useTenantStore();
const formStore = useFormStore();
const notificationStore = useNotificationStore();
const selectedValue = ref(null);

// Build dropdown items with only actual tenants (no Classic CHEFS option)
const allTenantOptions = computed(() => {
  return tenantStore.tenantsList;
});

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

// Switch back to Classic CHEFS (non-tenanted mode)
const switchToClassicChefs = async () => {
  try {
    tenantStore.clearSelectedTenant();
    selectedValue.value = null;

    // Fetch forms for Classic CHEFS mode (no tenant)
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
  // Get CSTAR URL from config or environment
  // TODO change to env later
  const cstarUrl =
    import.meta.env.VITE_CSTAR_URL ||
    'https://tenant-management-system-dev-frontend.apps.silver.devops.gov.bc.ca';
  window.open(cstarUrl, '_blank');
};

// Initialize - fetch tenants on component mount
onMounted(async () => {
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
    if (newTenant) {
      selectedValue.value = newTenant.id;
    }
  }
);
</script>

<style scoped lang="scss">
// Responsive breakpoints
$mobile-breakpoint: 600px;
$tablet-breakpoint: 960px;

.tenant-dropdown-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  width: auto;

  // Mobile: stack vertically
  @media (max-width: $mobile-breakpoint) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    width: 100%;
  }
}

.tenant-label-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  flex-shrink: 0;
  white-space: nowrap;

  .info-icon {
    color: var(--v-primary);
    opacity: 0.8;
    flex-shrink: 0;
    font-size: 1rem !important;
    height: 1rem;
    width: 1rem;
    min-width: 1rem;
    min-height: 1rem;
  }

  .tenant-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.87);
    display: inline;
    margin: 0;
    padding: 0;
    line-height: 1.2;

    .label-suffix {
      display: inline;
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.6);
      font-weight: 400;
      font-style: italic;
      margin-left: 0.3rem;
    }
  }

  @media (max-width: $mobile-breakpoint) {
    .tenant-label {
      font-size: 0.8rem;

      .label-suffix {
        display: none; // Hide on very small screens
      }
    }
  }
}

.tenant-input-wrapper {
  flex-shrink: 0;

  // Desktop: fixed width
  @media (min-width: $tablet-breakpoint) {
    width: 280px;
  }

  // Tablet: medium width
  @media (max-width: $tablet-breakpoint) and (min-width: $mobile-breakpoint) {
    width: 220px;
  }

  // Mobile: full width
  @media (max-width: $mobile-breakpoint) {
    width: 100%;
  }
}

.tenant-select {
  width: 100%;

  :deep(.v-field__input) {
    font-size: 0.95rem;
    min-height: 32px !important;
    height: 32px !important;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    align-items: center;
    padding: 8px 12px !important;
    background-color: #f7f9fc !important;
    color: #474543 !important;
    box-shadow: 0 0.6px 1.8px 0 rgba(0, 0, 0, 0.1) !important;
  }

  // Selected item text
  :deep(.v-field__input input) {
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    flex: 1;
  }

  :deep(.v-select__content) {
    padding: 0 !important;
  }

  // Allow text wrapping in dropdown menu items
  :deep(.v-list-item__content) {
    overflow: visible !important;
  }

  // FIX: Border outline issues - ensure proper border rendering
  :deep(.v-field__outline) {
    border-radius: 4px;
    overflow: hidden; // Prevent border artifacts
  }

  :deep(.v-field__outline__start) {
    border: 1px solid #d8d8d8;
    border-right: none !important; // Prevent double borders
    border-radius: 4px 0 0 4px;
  }

  :deep(.v-field__outline__notch) {
    border-top: 1px solid #d8d8d8;
    border-bottom: 1px solid #d8d8d8;
    border-left: none !important; // Prevent visible lines
    border-right: none !important;
  }

  :deep(.v-field__outline__end) {
    border: 1px solid #d8d8d8;
    border-left: none !important; // Prevent double borders
    border-radius: 0 4px 4px 0;
  }

  // Hide any extra border segments that might appear
  :deep(.v-field__outline:before),
  :deep(.v-field__outline:after) {
    display: none !important;
  }

  // Hover state
  &:hover:not(:disabled) {
    :deep(.v-field__outline__start) {
      border-color: rgba(0, 0, 0, 0.2);
      border-right: none !important;
    }
    :deep(.v-field__outline__notch) {
      border-color: rgba(0, 0, 0, 0.2);
      border-left: none !important;
      border-right: none !important;
    }
    :deep(.v-field__outline__end) {
      border-color: rgba(0, 0, 0, 0.2);
      border-left: none !important;
    }
  }

  // Focus state
  &:focus-within {
    :deep(.v-field__outline__start) {
      border-color: var(--v-primary);
      border-width: 2px;
      border-right: none !important;
    }
    :deep(.v-field__outline__notch) {
      border-color: var(--v-primary);
      border-width: 2px;
      border-left: none !important;
      border-right: none !important;
    }
    :deep(.v-field__outline__end) {
      border-color: var(--v-primary);
      border-width: 2px;
      border-left: none !important;
    }
  }

  // Dropdown menu width - match input width (248px from Figma)
  :deep(.v-overlay__content) {
    min-width: 248px !important;
    max-width: 248px !important;
    border-radius: 4px !important;
    background-color: #ffffff !important;
    box-shadow: 0 1.2px 3.6px 0 rgba(0, 0, 0, 0.18),
      0 6.4px 14.4px 0 rgba(0, 0, 0, 0.1) !important;

    @media (max-width: $mobile-breakpoint) {
      min-width: 248px !important;
      max-width: 100vw !important;
    }
  }

  // Dropdown menu list styling
  :deep(.v-list) {
    padding: 4px 0 !important;
  }

  // Style for all list items (tenant options)
  :deep(.v-list-item) {
    padding-left: 1rem !important;
    padding-right: 1rem !important;
    padding-top: 0.5rem !important;
    padding-bottom: 0.5rem !important;
    min-height: auto !important;
    border-bottom: none;

    &:last-of-type:not(.cstar-link-item) {
      border-bottom: none;
    }

    &:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }
  }

  :deep(.v-list-item__prepend) {
    margin-right: 1rem !important;
    margin-left: 0 !important;
  }

  :deep(.v-list-item__content) {
    padding: 0 !important;
  }

  :deep(.v-list-item--title) {
    white-space: normal !important;
    word-break: break-word !important;
    font-size: 0.95rem;
    color: rgba(0, 0, 0, 0.87);
    line-height: 1.4;
    margin: 0 !important;
  }

  // Classic CHEFS link item styling
  :deep(.classic-chefs-link-item) {
    cursor: pointer;
    padding-left: 1rem !important;
    padding-right: 1rem !important;
    padding-top: 0.75rem !important;
    padding-bottom: 0.75rem !important;
    min-height: auto !important;
    font-size: 0.9rem !important;
    color: var(--v-primary) !important;
    font-weight: 500;
    border-bottom: none;
    border-top: none;

    &:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }

    :deep(.v-icon) {
      color: var(--v-primary) !important;
      margin-right: 1rem !important;
      flex-shrink: 0;
    }

    :deep(.v-list-item__content) {
      padding: 0 !important;
      overflow: visible !important;
    }

    span {
      white-space: normal !important;
      word-break: break-word !important;
      line-height: 1.4;
      display: block;
    }
  }

  // CSTAR link item styling
  :deep(.cstar-link-item) {
    cursor: pointer;
    padding-left: 1rem !important;
    padding-right: 1rem !important;
    padding-top: 0.75rem !important;
    padding-bottom: 0.75rem !important;
    min-height: auto !important;
    font-size: 0.9rem !important;
    color: var(--v-primary) !important;
    font-weight: 500;
    border-bottom: none;
    border-top: 1px solid rgba(0, 0, 0, 0.08);

    &:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }

    :deep(.v-icon) {
      color: var(--v-primary) !important;
      margin-right: 1rem !important;
      flex-shrink: 0;
    }

    :deep(.v-list-item__content) {
      padding: 0 !important;
      overflow: visible !important;
    }

    span {
      white-space: normal !important;
      word-break: break-word !important;
      line-height: 1.4;
      display: block;
    }
  }

  // Divider styling
  :deep(.v-divider) {
    display: none !important; // Hide the divider, we're using borders instead
  }

  // No data state in dropdown
  :deep(.no-data-wrapper) {
    padding: 1.5rem 1rem;
    text-align: center;

    .no-data-message {
      margin: 0 0 0.75rem 0;
      font-size: 0.95rem;
      color: rgba(0, 0, 0, 0.87);
      font-weight: 500;
    }

    .no-data-subtext {
      margin: 0;
      font-size: 0.85rem;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.5;

      .cstar-link {
        color: var(--v-primary);
        text-decoration: none;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          text-decoration: underline;
          color: var(--v-primary-darken-1);
        }
      }
    }
  }
}

.tenant-helper-text {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);

  .helper-link {
    color: var(--v-primary);
    text-decoration: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      text-decoration: underline;
      color: var(--v-primary-darken-1);
    }
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .tenant-label-wrapper {
    .tenant-label {
      color: rgba(255, 255, 255, 0.87);

      .label-suffix {
        color: rgba(255, 255, 255, 0.6);
      }
    }

    .info-icon {
      color: #ffd54f !important; // Lighter yellow for dark mode
    }
  }

  .tenant-helper-text {
    color: rgba(255, 255, 255, 0.7);

    .helper-link {
      color: #ffd54f !important;
    }
  }

  .tenant-select {
    // Dark mode border fixes
    :deep(.v-field__outline__start) {
      border-color: rgba(255, 255, 255, 0.2) !important;
      border-right: none !important;
    }
    :deep(.v-field__outline__notch) {
      border-color: rgba(255, 255, 255, 0.2) !important;
      border-left: none !important;
      border-right: none !important;
    }
    :deep(.v-field__outline__end) {
      border-color: rgba(255, 255, 255, 0.2) !important;
      border-left: none !important;
    }

    :deep(.cstar-link-item) {
      color: #ffd54f !important;
    }

    :deep(.no-data-wrapper) {
      .no-data-message {
        color: rgba(255, 255, 255, 0.87);
      }

      .no-data-subtext {
        color: rgba(255, 255, 255, 0.7);

        .cstar-link {
          color: #ffd54f !important;
        }
      }
    }
  }
}
</style>
