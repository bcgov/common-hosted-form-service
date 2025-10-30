const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const config = require('config');

const jwtService = require('../../../src/components/jwtService');
jest.mock('../../../src/components/jwtService');

const { Role } = require('../../../src/forms/common/models');
const Form = require('../../../src/forms/common/models/tables/form');
const FormGroup = require('../../../src/forms/common/models/tables/formGroup');
const FormTenant = require('../../../src/forms/common/models/tables/formTenant');

jest.mock('../../../src/forms/common/models');
jest.mock('../../../src/forms/common/models/tables/form');
jest.mock('../../../src/forms/common/models/tables/formGroup');
jest.mock('../../../src/forms/common/models/tables/formTenant');

const tenantService = require('../../../src/components/tenantService');

describe('TenantService', () => {
  let mockAxios;
  const endpoint = config.get('cstar.endpoint');
  const listUserTenantsPath = config.get('cstar.listUserTenantsPath');
  const listGroupsForUserForTenantPath = config.get('cstar.listGroupsForUserForTenantPath');
  const listGroupsForTenant = config.get('cstar.listGroupsForTenant');

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    jwtService.getBearerToken.mockReset();
  });

  afterEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  describe('_getAuthHeaders', () => {
    it('should return Authorization header when token exists', () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      const req = { headers: { authorization: 'Bearer testtoken' } };

      const headers = tenantService._getAuthHeaders(req);

      expect(headers).toEqual({ Authorization: 'Bearer testtoken' });
      expect(jwtService.getBearerToken).toHaveBeenCalledWith(req);
    });

    it('should return empty object when no token exists', () => {
      jwtService.getBearerToken.mockReturnValue(null);
      const req = { headers: {} };

      const headers = tenantService._getAuthHeaders(req);

      expect(headers).toEqual({});
      expect(jwtService.getBearerToken).toHaveBeenCalledWith(req);
    });
  });

  describe('getCurrentUserTenants', () => {
    const userId = 'user-123';
    const req = {
      currentUser: { idpUserId: userId },
      headers: { authorization: 'Bearer testtoken' },
    };
    const apiUrl = `${endpoint}${listUserTenantsPath.replace('{userId}', userId)}`;

    it('should return tenants array on success', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).reply(200, {
        data: {
          tenants: [
            { id: 't1', name: 'Tenant 1' },
            { id: 't2', name: 'Tenant 2' },
          ],
        },
      });

      const tenants = await tenantService.getCurrentUserTenants(req);

      expect(tenants).toEqual([
        { id: 't1', name: 'Tenant 1' },
        { id: 't2', name: 'Tenant 2' },
      ]);
      expect(jwtService.getBearerToken).toHaveBeenCalledWith(req);
    });

    it('should return empty array when data.data.tenants is missing', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).reply(200, {});

      const tenants = await tenantService.getCurrentUserTenants(req);

      expect(tenants).toEqual([]);
    });

    it('should throw error on axios network error', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).networkError();

      await expect(tenantService.getCurrentUserTenants(req)).rejects.toThrow();
    });

    it('should throw error on axios 500 response', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).reply(500, { error: 'Internal Server Error' });

      await expect(tenantService.getCurrentUserTenants(req)).rejects.toThrow();
    });

    it('should throw error on 401 unauthorized when token is invalid', async () => {
      jwtService.getBearerToken.mockReturnValue('invalid-token');
      mockAxios.onGet(apiUrl).reply(401, { error: 'Unauthorized' });

      await expect(tenantService.getCurrentUserTenants(req)).rejects.toThrow();
    });

    it('should throw error on 403 forbidden when user lacks permissions', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).reply(403, { error: 'Forbidden' });

      await expect(tenantService.getCurrentUserTenants(req)).rejects.toThrow();
    });

    it('should throw error if no currentUser', async () => {
      await expect(tenantService.getCurrentUserTenants({})).rejects.toThrow('TenantService: missing currentUser');
      expect(jwtService.getBearerToken).not.toHaveBeenCalled();
    });

    it('should throw error if no idpUserId', async () => {
      await expect(tenantService.getCurrentUserTenants({ currentUser: {} })).rejects.toThrow('TenantService: missing currentUser.idpUserId');
      expect(jwtService.getBearerToken).not.toHaveBeenCalled();
    });

    it('should include Authorization header when token exists', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).reply((config) => {
        expect(config.headers.Authorization).toBe('Bearer testtoken');
        return [200, { data: { tenants: [] } }];
      });

      await tenantService.getCurrentUserTenants(req);
    });
  });

  describe('getUserTenantGroupsAndRoles', () => {
    const userId = 'user-123';
    const tenantId = 'tenant-456';
    const req = {
      currentUser: {
        idpUserId: userId,
        tenantId: tenantId,
      },
      headers: { authorization: 'Bearer testtoken' },
    };
    const apiUrl = `${endpoint}${listGroupsForUserForTenantPath.replace('{tenantId}', tenantId).replace('{userId}', userId)}`;

    it('should return groups with roles on success', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).reply(200, {
        data: {
          groups: [
            {
              id: 'group-1',
              name: 'Group 1',
              sharedServiceRoles: [
                { name: 'form_admin', enabled: true },
                { name: 'viewer', enabled: false },
              ],
            },
            {
              id: 'group-2',
              name: 'Group 2',
              sharedServiceRoles: [{ name: 'editor', enabled: true }],
            },
          ],
        },
      });

      const groups = await tenantService.getUserTenantGroupsAndRoles(req);

      expect(groups).toEqual([
        { id: 'group-1', name: 'Group 1', roles: ['form_admin'] },
        { id: 'group-2', name: 'Group 2', roles: ['editor'] },
      ]);
      expect(jwtService.getBearerToken).toHaveBeenCalledWith(req);
    });

    it('should return empty array when no groups in response', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).reply(200, { data: {} });

      const groups = await tenantService.getUserTenantGroupsAndRoles(req);

      expect(groups).toEqual([]);
    });

    it('should handle groups without sharedServiceRoles', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).reply(200, {
        data: {
          groups: [{ id: 'group-1', name: 'Group 1' }],
        },
      });

      const groups = await tenantService.getUserTenantGroupsAndRoles(req);

      expect(groups).toEqual([{ id: 'group-1', name: 'Group 1', roles: [] }]);
    });

    it('should throw error on axios network error', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).networkError();

      await expect(tenantService.getUserTenantGroupsAndRoles(req)).rejects.toThrow();
    });

    it('should throw error on 401 unauthorized', async () => {
      jwtService.getBearerToken.mockReturnValue('invalid-token');
      mockAxios.onGet(apiUrl).reply(401, { error: 'Unauthorized' });

      await expect(tenantService.getUserTenantGroupsAndRoles(req)).rejects.toThrow();
    });

    it('should throw error if no currentUser', async () => {
      await expect(tenantService.getUserTenantGroupsAndRoles({})).rejects.toThrow('TenantService: missing currentUser');
      expect(jwtService.getBearerToken).not.toHaveBeenCalled();
    });

    it('should throw error if no idpUserId', async () => {
      await expect(
        tenantService.getUserTenantGroupsAndRoles({
          currentUser: { tenantId: 'tenant-456' },
        })
      ).rejects.toThrow('TenantService: missing currentUser.idpUserId');
      expect(jwtService.getBearerToken).not.toHaveBeenCalled();
    });

    it('should throw error if no tenantId', async () => {
      await expect(
        tenantService.getUserTenantGroupsAndRoles({
          currentUser: { idpUserId: 'user-123' },
        })
      ).rejects.toThrow('TenantService: missing currentUser.tenantId');
      expect(jwtService.getBearerToken).not.toHaveBeenCalled();
    });
  });

  describe('getGroupsForCurrentTenant', () => {
    const tenantId = 'tenant-456';
    const req = {
      currentUser: { tenantId: tenantId },
      headers: { authorization: 'Bearer testtoken' },
    };
    const apiUrl = `${endpoint}${listGroupsForTenant.replace('{tenantId}', tenantId)}`;

    it('should return groups for tenant on success', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).reply(200, {
        data: {
          groups: [
            { id: 'group-1', name: 'Group 1', description: 'First group' },
            { id: 'group-2', name: 'Group 2', description: 'Second group' },
          ],
        },
      });

      const groups = await tenantService.getGroupsForCurrentTenant(req);

      expect(groups).toEqual([
        { id: 'group-1', name: 'Group 1', description: 'First group' },
        { id: 'group-2', name: 'Group 2', description: 'Second group' },
      ]);
      expect(jwtService.getBearerToken).toHaveBeenCalledWith(req);
    });

    it('should return empty array when no groups in response', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).reply(200, {});

      const groups = await tenantService.getGroupsForCurrentTenant(req);

      expect(groups).toEqual([]);
    });

    it('should throw error on axios network error', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).networkError();

      await expect(tenantService.getGroupsForCurrentTenant(req)).rejects.toThrow();
    });

    it('should throw error on 401 unauthorized', async () => {
      jwtService.getBearerToken.mockReturnValue('invalid-token');
      mockAxios.onGet(apiUrl).reply(401, { error: 'Unauthorized' });

      await expect(tenantService.getGroupsForCurrentTenant(req)).rejects.toThrow();
    });

    it('should throw error if no currentUser', async () => {
      await expect(tenantService.getGroupsForCurrentTenant({})).rejects.toThrow('TenantService: missing currentUser');
      expect(jwtService.getBearerToken).not.toHaveBeenCalled();
    });

    it('should throw error if no tenantId', async () => {
      await expect(tenantService.getGroupsForCurrentTenant({ currentUser: {} })).rejects.toThrow('TenantService: missing currentUser.tenantId');
      expect(jwtService.getBearerToken).not.toHaveBeenCalled();
    });
  });

  describe('getFormGroups', () => {
    const tenantId = 'tenant-456';
    const req = {
      currentUser: { tenantId: tenantId },
      headers: { authorization: 'Bearer testtoken' },
    };
    const formId = 'form-123';
    const apiUrl = `${endpoint}${listGroupsForTenant.replace('{tenantId}', tenantId)}`;

    beforeEach(() => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
    });

    it('should return associated, missing, and available groups', async () => {
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ formId, tenantId: tenantId }),
        }),
      });

      FormGroup.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([{ groupId: 'group-1' }, { groupId: 'group-2' }, { groupId: 'group-deleted' }]),
        }),
      });

      mockAxios.onGet(apiUrl).reply(200, {
        data: {
          groups: [
            { id: 'group-1', name: 'Group 1', description: 'First' },
            { id: 'group-2', name: 'Group 2', description: 'Second' },
            { id: 'group-3', name: 'Group 3', description: 'Third' },
          ],
        },
      });

      const result = await tenantService.getFormGroups(req, formId);

      expect(result.associatedGroups).toEqual([
        { id: 'group-1', name: 'Group 1', description: 'First', isAssociated: true },
        { id: 'group-2', name: 'Group 2', description: 'Second', isAssociated: true },
      ]);
      expect(result.missingGroups).toEqual([
        {
          id: 'group-deleted',
          name: 'Group no longer available',
          description: 'This group may have been deleted from the tenant',
          isAssociated: true,
          isDeleted: true,
        },
      ]);
      expect(result.availableGroups).toEqual([{ id: 'group-3', name: 'Group 3', description: 'Third', isAssociated: false }]);
    });

    it('should throw error if no currentUser', async () => {
      await expect(tenantService.getFormGroups({}, formId)).rejects.toThrow('TenantService: missing currentUser');
    });

    it('should throw error if no tenantId', async () => {
      await expect(tenantService.getFormGroups({ currentUser: {} }, formId)).rejects.toThrow('TenantService: missing currentUser.tenantId');
    });

    it('should throw error if no formId', async () => {
      await expect(tenantService.getFormGroups(req, null)).rejects.toThrow('TenantService: missing formId');
    });

    it('should throw error if form not in tenant', async () => {
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(tenantService.getFormGroups(req, formId)).rejects.toThrow('TenantService: form not found in tenant');
    });

    it('should throw error on database error', async () => {
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockRejectedValue(new Error('DB error')),
        }),
      });

      await expect(tenantService.getFormGroups(req, formId)).rejects.toThrow('DB error');
    });

    it('should throw error when getGroupsForCurrentTenant fails', async () => {
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ formId, tenantId: tenantId }),
        }),
      });

      FormGroup.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([]),
        }),
      });

      mockAxios.onGet(apiUrl).networkError();

      await expect(tenantService.getFormGroups(req, formId)).rejects.toThrow();
    });
  });

  describe('assignGroupsToForm', () => {
    const userId = 'user-123';
    const tenantId = 'tenant-456';
    const req = {
      currentUser: {
        tenantId: tenantId,
        usernameIdp: 'testuser',
        idpUserId: userId,
      },
      headers: { authorization: 'Bearer testtoken' },
    };
    const formId = 'form-123';
    const groupIds = ['group-1', 'group-2'];
    const apiUrl = `${endpoint}${listGroupsForUserForTenantPath.replace('{tenantId}', tenantId).replace('{userId}', userId)}`;

    beforeEach(() => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
    });

    it('should assign groups successfully when user has form_admin', async () => {
      Form.query.mockReturnValue({
        findById: jest.fn().mockResolvedValue({ id: formId }),
      });

      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ formId, tenantId: tenantId }),
        }),
      });

      mockAxios.onGet(apiUrl).reply(200, {
        data: {
          groups: [
            {
              id: 'group-1',
              name: 'Admin Group',
              sharedServiceRoles: [{ name: 'form_admin', enabled: true }],
            },
          ],
        },
      });

      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(true),
      });
      const mockInsert = jest.fn().mockResolvedValue(true);

      FormGroup.query.mockReturnValue({
        delete: mockDelete,
        insert: mockInsert,
      });

      const result = await tenantService.assignGroupsToForm(req, formId, groupIds);

      expect(result).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            formId,
            groupId: 'group-1',
            createdBy: 'testuser',
          }),
          expect.objectContaining({
            formId,
            groupId: 'group-2',
            createdBy: 'testuser',
          }),
        ])
      );
    });

    it('should throw error if no currentUser', async () => {
      await expect(tenantService.assignGroupsToForm({}, formId, groupIds)).rejects.toThrow('TenantService: missing currentUser');
    });

    it('should throw error if no tenantId', async () => {
      await expect(tenantService.assignGroupsToForm({ currentUser: {} }, formId, groupIds)).rejects.toThrow('TenantService: missing currentUser.tenantId');
    });

    it('should throw error if no formId', async () => {
      await expect(tenantService.assignGroupsToForm(req, null, groupIds)).rejects.toThrow('TenantService: missing formId');
    });

    it('should throw error if groupIds is not an array', async () => {
      await expect(tenantService.assignGroupsToForm(req, formId, 'not-an-array')).rejects.toThrow('TenantService: groupIds must be an array');
    });

    it('should throw error if form does not exist', async () => {
      Form.query.mockReturnValue({
        findById: jest.fn().mockResolvedValue(null),
      });

      await expect(tenantService.assignGroupsToForm(req, formId, groupIds)).rejects.toThrow('TenantService: form not found');
    });

    it('should throw error if form not in tenant', async () => {
      Form.query.mockReturnValue({
        findById: jest.fn().mockResolvedValue({ id: formId }),
      });
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(tenantService.assignGroupsToForm(req, formId, groupIds)).rejects.toThrow('TenantService: form not in tenant');
    });

    it('should throw error if user does not have form_admin role', async () => {
      Form.query.mockReturnValue({
        findById: jest.fn().mockResolvedValue({ id: formId }),
      });
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ formId, tenantId: tenantId }),
        }),
      });
      mockAxios.onGet(apiUrl).reply(200, {
        data: {
          groups: [
            {
              id: 'group-1',
              name: 'Regular Group',
              sharedServiceRoles: [{ name: 'viewer', enabled: true }],
            },
          ],
        },
      });

      await expect(tenantService.assignGroupsToForm(req, formId, groupIds)).rejects.toThrow('TenantService: insufficient permissions');
    });

    it('should throw error on database failure during delete', async () => {
      Form.query.mockReturnValue({
        findById: jest.fn().mockResolvedValue({ id: formId }),
      });

      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ formId, tenantId: tenantId }),
        }),
      });

      mockAxios.onGet(apiUrl).reply(200, {
        data: {
          groups: [
            {
              id: 'group-1',
              name: 'Admin Group',
              sharedServiceRoles: [{ name: 'form_admin', enabled: true }],
            },
          ],
        },
      });

      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockRejectedValue(new Error('DB delete error')),
      });

      FormGroup.query.mockReturnValue({
        delete: mockDelete,
      });

      await expect(tenantService.assignGroupsToForm(req, formId, groupIds)).rejects.toThrow('DB delete error');
    });
  });

  describe('getUserRolesAndPermissions', () => {
    const userId = 'user-123';
    const tenantId = 'tenant-456';
    const userInfo = {
      idpUserId: userId,
      tenantId: tenantId,
    };
    const apiUrl = `${endpoint}${listGroupsForUserForTenantPath.replace('{tenantId}', tenantId).replace('{userId}', userId)}`;

    beforeEach(() => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
    });

    it('should return user roles and permissions', async () => {
      Role.query.mockReturnValue({
        withGraphFetched: jest.fn().mockResolvedValue([
          {
            code: 'form_admin',
            permissions: [{ code: 'form_read' }, { code: 'form_update' }, { code: 'form_delete' }],
          },
          {
            code: 'viewer',
            permissions: [{ code: 'form_read' }],
          },
        ]),
      });

      mockAxios.onGet(apiUrl).reply(200, {
        data: {
          groups: [
            {
              id: 'group-1',
              name: 'Admin Group',
              sharedServiceRoles: [
                { name: 'form_admin', enabled: true },
                { name: 'viewer', enabled: true },
              ],
            },
          ],
        },
      });

      const result = await tenantService.getUserRolesAndPermissions(userInfo);

      expect(result.roles).toEqual(['form_admin', 'viewer']);
      expect(result.permissions).toEqual(expect.arrayContaining(['form_read', 'form_update', 'form_delete']));
      expect(result.permissions.length).toBe(3);
    });

    it('should return empty arrays when user has no groups', async () => {
      Role.query.mockReturnValue({
        withGraphFetched: jest.fn().mockResolvedValue([]),
      });
      mockAxios.onGet(apiUrl).reply(200, { data: { groups: [] } });

      const result = await tenantService.getUserRolesAndPermissions(userInfo);

      expect(result.roles).toEqual([]);
      expect(result.permissions).toEqual([]);
    });

    it('should throw error if no userInfo', async () => {
      await expect(tenantService.getUserRolesAndPermissions(null)).rejects.toThrow('TenantService: missing userInfo');
    });

    it('should throw error if no idpUserId', async () => {
      await expect(tenantService.getUserRolesAndPermissions({ tenantId })).rejects.toThrow('TenantService: missing userInfo.idpUserId');
    });

    it('should throw error if no tenantId', async () => {
      await expect(tenantService.getUserRolesAndPermissions({ idpUserId: userId })).rejects.toThrow('TenantService: missing userInfo.tenantId');
    });

    it('should throw error when Role query fails', async () => {
      Role.query.mockReturnValue({
        withGraphFetched: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await expect(tenantService.getUserRolesAndPermissions(userInfo)).rejects.toThrow('DB error');
    });

    it('should throw error when getUserTenantGroupsAndRoles fails', async () => {
      Role.query.mockReturnValue({
        withGraphFetched: jest.fn().mockResolvedValue([]),
      });
      mockAxios.onGet(apiUrl).networkError();

      await expect(tenantService.getUserRolesAndPermissions(userInfo)).rejects.toThrow();
    });
  });

  describe('canCreateForm', () => {
    const userId = 'user-123';
    const tenantId = 'tenant-456';
    const apiUrl = `${endpoint}${listGroupsForUserForTenantPath.replace('{tenantId}', tenantId).replace('{userId}', userId)}`;

    beforeEach(() => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
    });

    it('should return true for IDIR user without tenantId', async () => {
      const req = {
        currentUser: {
          idp: 'idir',
          idpUserId: userId,
        },
      };

      const result = await tenantService.canCreateForm(req);
      expect(result).toBe(true);
    });

    it('should return true for IDIR user with tenantId and form_admin role', async () => {
      const req = {
        currentUser: {
          idp: 'idir',
          idpUserId: userId,
          tenantId: tenantId,
        },
      };

      mockAxios.onGet(apiUrl).reply(200, {
        data: {
          groups: [
            {
              id: 'group-1',
              name: 'Admin Group',
              sharedServiceRoles: [{ name: 'form_admin', enabled: true }],
            },
          ],
        },
      });

      const result = await tenantService.canCreateForm(req);
      expect(result).toBe(true);
    });

    it('should return false for IDIR user with tenantId but no form_admin role', async () => {
      const req = {
        currentUser: {
          idp: 'idir',
          idpUserId: userId,
          tenantId: tenantId,
        },
      };

      mockAxios.onGet(apiUrl).reply(200, {
        data: {
          groups: [
            {
              id: 'group-1',
              name: 'Regular Group',
              sharedServiceRoles: [{ name: 'viewer', enabled: true }],
            },
          ],
        },
      });

      const result = await tenantService.canCreateForm(req);
      expect(result).toBe(false);
    });

    it('should return false for non-IDIR user', async () => {
      const req = {
        currentUser: {
          idp: 'bceid',
          idpUserId: userId,
        },
      };

      const result = await tenantService.canCreateForm(req);
      expect(result).toBe(false);
    });

    it('should throw error if no currentUser', async () => {
      await expect(tenantService.canCreateForm({})).rejects.toThrow('TenantService: missing currentUser');
    });

    it('should throw error when getUserTenantGroupsAndRoles fails', async () => {
      const req = {
        currentUser: {
          idp: 'idir',
          idpUserId: userId,
          tenantId: tenantId,
        },
      };

      mockAxios.onGet(apiUrl).networkError();

      await expect(tenantService.canCreateForm(req)).rejects.toThrow();
    });
  });

  describe('isFormInUsersTenant', () => {
    const formId = 'b2e85f8e-4d92-4d02-882a-5d6f5e3c3e3e';

    it('should return true for user without tenantId', async () => {
      const req = { currentUser: {} };

      const result = await tenantService.isFormInUsersTenant(req, formId);
      expect(result).toBe(true);
    });

    it('should return true when form belongs to user tenant', async () => {
      const req = { currentUser: { tenantId: 'tenant-456' } };

      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ formId: formId, tenantId: 'tenant-456' }),
        }),
      });

      const result = await tenantService.isFormInUsersTenant(req, formId);
      expect(result).toBe(true);
    });

    it('should return false when form does not belong to user tenant', async () => {
      const req = { currentUser: { tenantId: 'tenant-456' } };

      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await tenantService.isFormInUsersTenant(req, formId);
      expect(result).toBe(false);
    });

    it('should return false for invalid formId', async () => {
      const req = { currentUser: { tenantId: 'tenant-456' } };

      const result = await tenantService.isFormInUsersTenant(req, 'invalid-uuid');
      expect(result).toBe(false);
    });

    it('should throw error if no currentUser', async () => {
      await expect(tenantService.isFormInUsersTenant({}, formId)).rejects.toThrow('TenantService: missing currentUser');
    });

    it('should throw error on database error', async () => {
      const req = { currentUser: { tenantId: 'tenant-456' } };

      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockRejectedValue(new Error('DB error')),
        }),
      });

      await expect(tenantService.isFormInUsersTenant(req, formId)).rejects.toThrow('DB error');
    });
  });
});
