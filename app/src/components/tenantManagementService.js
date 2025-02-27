const config = require('config');
const errorToProblem = require('./errorToProblem');
const SERVICE = 'tenantManagement';

class tenantManagementService {
  constructor(apiUrl) {
    if (!apiUrl) {
      throw new Error('tenantManagementService is not configured. Check configuration.');
    }
    this.apiUrl = apiUrl;
  }

  async getTenantsByUserId() {
    try {
      const data = {
        data: {
          tenants: [
            {
              id: '31632dff-96f1-478e-bd77-24ebf2c93094',
              name: 'Tenant 1',
              ministryName: 'Ministry of Something',
              createdDateTime: '2025-02-13T04:08:16.105Z',
              updatedDateTime: '2025-02-13T04:08:16.105Z',
            },
            {
              id: 'd46a6548-ba5e-47d8-b1b6-de2a6d447650',
              name: 'Tenant 2',
              ministryName: 'Ministry of Something',
              createdDateTime: '2025-02-13T05:18:13.987Z',
              updatedDateTime: '2025-02-13T05:18:13.987Z',
            },
            {
              id: '8b802d2f-7001-47f4-ade8-b01ff868149b',
              name: 'Tenant 3',
              ministryName: 'Ministry of Something',
              createdDateTime: '2025-02-13T05:31:41.749Z',
              updatedDateTime: '2025-02-13T05:31:41.749Z',
            },
          ],
        },
      };

      return data.data.tenants;
    } catch (e) {
      errorToProblem(SERVICE, e);
      return { data: { tenants: [] } };
    }
  }
}

const endpoint = config.get('serviceClient.commonServices.tenantManagementService.endpoint');

let tmsService = new tenantManagementService(endpoint);
module.exports = tmsService;
