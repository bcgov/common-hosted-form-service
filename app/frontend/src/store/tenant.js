import { defineStore } from 'pinia';
import { tenantService } from '~/services';

export const useTenantStore = defineStore('tenant', {
  state: () => ({
    tenants: [],
    selectedTenant: null,
    nonTenantedMode: false, // Track non-tenanted mode.
    tenantName: null,
  }),
  getters: {
    hasTenants: (state) => state.tenants.length > 0,
    getTenantName: (state) => {
      if (state.selectedTenant === null && state.nonTenantedMode) {
        return 'Personal CHEFS';
      }
      const tenant = state.tenants.find((t) => t.id === state.selectedTenant);
      return tenant ? tenant.name : null;
    },
  },
  actions: {
    async getTenantsForUser() {
      try {
        // Get the forms based on the user's permissions
        const response = await tenantService.getTenantsForUser();
        const data = response.data;
        this.tenants = data;
      } catch (error) {
        throw new Error('something went wrong while getting tenants ', error);
      }
    },
    async getRolesForUserGivenTenant() {
      try {
        // Get the forms based on the user's permissions
        const response = await tenantService.getTenantsForUser();
        const data = response.data;
        this.tenants = data;
      } catch (error) {
        throw new Error('something went wrong while getting tenants ', error);
      }
    },
    setSelectedTenant(tenant) {
      this.selectedTenant = tenant;
      this.nonTenantedMode = false; // Reset non-tenanted mode if a tenant is selected
    },
    setNonTenantedMode() {
      this.selectedTenant = null;
      this.nonTenantedMode = true;
    },
  },
});
