const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const fs = require('fs');
const path = require('path');

jest.mock('fs');
const errorToProblem = require('../../../src/components/errorToProblem');
jest.mock('../../../src/components/errorToProblem', () => jest.fn());

const tenantService = require('../../../src/components/tenantService');

describe('getCurrentUserTenants', () => {
  const req = { currentUser: { idpUserId: 'user-123' } };
  const apiUrl = 'https://tenant-management-system-pr-202-frontend.apps.silver.devops.gov.bc.ca/api/v1/users/user-123/tenants';
  let mockAxios;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    fs.readFileSync.mockReset();
    errorToProblem.mockClear();
  });

  it('should return tenants array on success', async () => {
    fs.readFileSync.mockReturnValue('testtoken');
    mockAxios.onGet(apiUrl).reply(200, {
      data: {
        tenants: [{ id: 't1', name: 'Tenant 1' }],
      },
    });

    const tenants = await tenantService.getCurrentUserTenants(req);
    expect(tenants).toEqual([{ id: 't1', name: 'Tenant 1' }]);
    expect(errorToProblem).not.toHaveBeenCalled();
  });

  it('should return empty array if token file missing', async () => {
    fs.readFileSync.mockImplementation(() => {
      throw new Error('not found');
    });

    const tenants = await tenantService.getCurrentUserTenants(req);
    expect(tenants).toEqual([]);
    expect(errorToProblem).not.toHaveBeenCalled();
  });

  it('should return empty array and call errorToProblem on axios error', async () => {
    fs.readFileSync.mockReturnValue('testtoken');
    mockAxios.onGet(apiUrl).networkError();

    const tenants = await tenantService.getCurrentUserTenants(req);
    expect(tenants).toEqual([]);
    expect(errorToProblem).toHaveBeenCalled();
  });

  it('should return empty array if no currentUser or idpUserId', async () => {
    const tenants = await tenantService.getCurrentUserTenants({});
    expect(tenants).toEqual([]);
    expect(errorToProblem).not.toHaveBeenCalled();
  });
});
