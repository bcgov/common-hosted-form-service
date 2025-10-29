import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';
import { rbacService } from '~/services';
import { useNotificationStore } from '~/store/notification';

export const useTenantStore = defineStore('tenant', {
  state: () => ({
    tenants: [], // List of available tenants
    selectedTenant: useLocalStorage('selectedTenant', null), // Currently selected tenant (persisted)
    loading: false, // Loading state for API calls
    error: null, // Error message if any
  }),

  getters: {
    /**
     * Get the current selected tenant
     */
    currentTenant: (state) => state.selectedTenant,

    /**
     * Get tenant by ID
     */
    getTenantById: (state) => (tenantId) => {
      return state.tenants.find((t) => t.id === tenantId);
    },

    /**
     * Check if tenants are available
     */
    hasTenants: (state) => state.tenants.length > 0,

    /**
     * Get formatted tenant list for dropdown
     */
    tenantsList: (state) =>
      state.tenants.map((t) => ({
        id: t.id,
        name: t.name || t.displayName,
        displayName: t.displayName,
        value: t.id,
        text: t.name || t.displayName,
      })),
  },

  actions: {
    /**
     * Fetch all available tenants for the current user
     */
    async fetchTenants() {
      this.loading = true;
      this.error = null;

      try {
        const response = await rbacService.getCurrentUserTenants();
        this.tenants = response.data || [];

        // If user had a previously selected tenant, validate it still exists
        if (
          this.selectedTenant &&
          !this.getTenantById(this.selectedTenant.id)
        ) {
          this.selectedTenant = null;
        }

        // Don't auto-select first tenant - keep user in Classic CHEFS mode on login
      } catch (error) {
        this.error = error.message || 'Failed to fetch tenants';
        useNotificationStore().addNotification({
          text: 'Error fetching tenants',
          consoleError: error,
        });
      } finally {
        this.loading = false;
      }
    },

    /**
     * Select a tenant
     * @param {Object} tenant The tenant object to select
     */
    selectTenant(tenant) {
      this.selectedTenant = tenant;
      // Persist to localStorage automatically via useLocalStorage
    },

    /**
     * Clear selected tenant
     */
    clearSelectedTenant() {
      this.selectedTenant = null;
    },

    /**
     * Reset tenant store to initial state
     */
    resetTenant() {
      this.tenants = [];
      this.selectedTenant = null;
      this.loading = false;
      this.error = null;
    },
  },
});
