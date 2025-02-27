const tenantManagementService = require('../../components/tenantManagementService');

const service = {
  getTenantsByUserId: async (currentUser = {}) => {
    if (!currentUser || !currentUser.id) return [];
    let tenants = await tenantManagementService.getTenantsByUserId();
    //getTenantsByUserId(currentUser.id);
    return tenants;
  },
};

module.exports = service;
