const config = require('config');
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

    // try {
    //   // Mock roles data
    //   const roles = [
    //     {
    //       id: '3',
    //       name: 'form_designer',
    //       description: 'Can design and modify forms',
    //       createdDateTime: new Date().toISOString(),
    //       updatedDateTime: new Date().toISOString(),
    //     },
    //     {
    //       id: '4',
    //       name: 'submission_reviewer',
    //       description: 'Can review form submissions',
    //       createdDateTime: new Date().toISOString(),
    //       updatedDateTime: new Date().toISOString(),
    //     },
    //     {
    //       id: '5',
    //       name: 'form_submitter',
    //       description: 'Can submit forms',
    //       createdDateTime: new Date().toISOString(),
    //       updatedDateTime: new Date().toISOString(),
    //     },
    //   ];

    //   // Returning the roles wrapped in the expected response format
    //   return {
    //     roles,
    //   };
    // } catch (error) {
    //   errorToProblem(SERVICE, error);
    //   throw new Error('Failed to fetch roles');
    // }
  }
}

const endpoint = config.get('serviceClient.commonServices.tenantManagementService.endpoint');

let tmsService = new tenantManagementService(endpoint);
module.exports = tmsService;
