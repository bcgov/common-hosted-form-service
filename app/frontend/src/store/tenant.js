import { defineStore } from 'pinia';
import { rbacService } from '~/services';
import { useNotificationStore } from '~/store/notification';
import getRouter from '~/router';

export const useTenantStore = defineStore('tenant', {
  state: () => ({
    tenants: [], // List of available tenants
    selectedTenant: null, // Currently selected tenant (persisted to localStorage)
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
     * Check if the selected tenant has form_admin role
     */
    isFormAdmin: (state) =>
      state.selectedTenant?.roles?.includes('form_admin') ?? false,

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
     * Initialize store - load selected tenant from localStorage
     */
    initializeStore() {
      try {
        const stored = localStorage.getItem('selectedTenant');
        if (stored && stored !== 'null' && stored !== 'undefined') {
          this.selectedTenant = JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Failed to parse stored tenant, clearing:', error); // eslint-disable-line no-console
        localStorage.removeItem('selectedTenant');
      }
    },

    /**
     * Save selected tenant to localStorage
     */
    persistSelectedTenant() {
      try {
        if (this.selectedTenant) {
          localStorage.setItem(
            'selectedTenant',
            JSON.stringify(this.selectedTenant)
          );
        } else {
          localStorage.removeItem('selectedTenant');
        }
      } catch (error) {
        console.warn('Failed to persist tenant to localStorage:', error); // eslint-disable-line no-console
      }
    },

    /**
     * Fetch all available tenants for the current user
     */
    async fetchTenants() {
      // Skip tenant API call on submission pages - they don't need tenant info
      try {
        const router = getRouter();
        if (router?.currentRoute?.value?.meta?.formSubmitMode) {
          return;
        }
      } catch (error) {
        console.warn('Router not available during fetchTenants:', error); // eslint-disable-line no-console
      }

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
          this.persistSelectedTenant();
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
      this.persistSelectedTenant();
    },

    /**
     * Clear selected tenant
     */
    clearSelectedTenant() {
      this.selectedTenant = null;
      this.persistSelectedTenant();
    },

    /**
     * Reset tenant store to initial state
     */
    resetTenant() {
      this.tenants = [];
      this.selectedTenant = null;
      this.loading = false;
      this.error = null;
      this.persistSelectedTenant();
    },
  },
});
