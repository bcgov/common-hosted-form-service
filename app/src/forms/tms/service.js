const tenantManagementService = require('../../components/tenantManagementService');

const service = {
  getTenantsByUserId: async (currentUser = {}) => {
    if (!currentUser || !currentUser.idpUserId) return [];
    let tenants = await tenantManagementService.getTenantsByUserId(currentUser.idpUserId);
    return tenants;
  },
  getRolesForUserGivenTenant: async (currentUser = {}) => {
    if (!currentUser || !currentUser.idpUserId || !currentUser.tenantId) return [];
    let roles = await tenantManagementService.getRolesForUserGivenTenant(currentUser.tenantId, currentUser.idpUserId);
    return roles;
  },
  getRolesForUserIdGivenTenantId: async (tenantId, userId) => {
    if (!tenantId || !userId) return [];
    let roles = await tenantManagementService.getRolesForUserGivenTenant(tenantId, userId);
    return roles;
  },
};

module.exports = service;
