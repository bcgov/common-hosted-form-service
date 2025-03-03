import { defineStore } from 'pinia';
import { tenantService } from '~/services';

export const useTenantStore = defineStore('tenant', {
  state: () => ({
    tenants: [],
    selectedTenant: null,
  }),
  getters: {
    hasTenants: (state) => state.tenants.length > 0,
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
    setSelectedTenant(tenant) {
      this.selectedTenant = tenant;
    },
  },
});
