//const config = require('config');
const errorToProblem = require('./errorToProblem');
const axios = require('axios');
const SERVICE = 'tenantManagement';

class tenantManagementService {
  constructor(apiUrl) {
    if (!apiUrl) {
      throw new Error('tenantManagementService is not configured. Check configuration.');
    }
    this.apiUrl = apiUrl;
  }
  async getTenantsByUserId(userId) {
    try {
      const { data } = await axios.get(`${endpoint}/users/${userId}/tenants`);
      if (data && data.data && data.data.tenants && Array.isArray(data.data.tenants) && data.data.tenants.length > 0) {
        return data.data.tenants;
      }
    } catch (e) {
      errorToProblem(SERVICE, e);
    }
    return [];
  }

  async getRolesForUserGivenTenant(tenantId, idpUserId) {
    try {
      const { data } = await axios.get(`${endpoint}/tenants/${tenantId}/ssousers/${idpUserId}/roles`);
      if (data && data.data && data.data.roles && Array.isArray(data.data.roles) && data.data.roles.length > 0) {
        return data.data.roles;
      }
    } catch (e) {
      errorToProblem(SERVICE, e);
    }
    return [];
  }
}

const endpoint = 'https://tms-api-poc.apps.silver.devops.gov.bc.ca/v1'; //config.get('serviceClient.commonServices.tenantManagementService.endpoint');

let tmsService = new tenantManagementService(endpoint);
module.exports = tmsService;
