const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const config = require('config');

const jwtService = require('../../../src/components/jwtService');
jest.mock('../../../src/components/jwtService');

const idpService = require('../../../src/components/idpService');
jest.mock('../../../src/components/idpService');

const { Role, User } = require('../../../src/forms/common/models');
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
    jest.restoreAllMocks();
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

    it('should return tenants array enriched with deduplicated roles on success', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      jest.spyOn(tenantService, 'getUserTenantGroupsAndRoles').mockImplementation(async ({ currentUser }) => {
        if (currentUser.tenantId === 't1') {
          return [{ id: 'g1', name: 'Group 1', roles: ['form_admin', 'form_designer', 'form_designer'] }];
        }
        if (currentUser.tenantId === 't2') {
          return [{ id: 'g2', name: 'Group 2', roles: ['submission_reviewer'] }];
        }
        return [];
      });
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
        { id: 't1', name: 'Tenant 1', roles: ['form_admin', 'form_designer'] },
        { id: 't2', name: 'Tenant 2', roles: ['submission_reviewer'] },
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

    it('should return empty array and mark degraded on 500', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      const reqMutable = { currentUser: { idpUserId: userId }, headers: { authorization: 'Bearer testtoken' } };
      mockAxios.onGet(apiUrl).reply(500, { error: 'Internal Server Error' });

      const tenants = await tenantService.getCurrentUserTenants(reqMutable);

      expect(tenants).toEqual([]);
      expect(reqMutable._tenantServiceDegraded).toBe(true);
    });

    it('should return empty array and mark degraded on 503', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).reply(503, { error: 'Service unavailable' });

      const tenants = await tenantService.getCurrentUserTenants(req);

      expect(tenants).toEqual([]);
      expect(req._tenantServiceDegraded).toBe(true);
    });

    it('should return empty array and mark degraded on ECONNREFUSED', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).reply(() => Promise.reject(Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' })));

      const tenants = await tenantService.getCurrentUserTenants(req);

      expect(tenants).toEqual([]);
      expect(req._tenantServiceDegraded).toBe(true);
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
      expect.hasAssertions();
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
    const tenantId = '0d3f5d5f-1a2b-4c3d-9e8f-112233445566';
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
                { name: 'form_admin', isDeleted: false },
                { name: 'form_designer', isDeleted: false },
              ],
            },
            {
              id: 'group-2',
              name: 'Group 2',
              sharedServiceRoles: [{ name: 'submission_reviewer', isDeleted: false }],
            },
          ],
        },
      });

      const groups = await tenantService.getUserTenantGroupsAndRoles(req, tenantId);

      expect(groups).toEqual([
        { id: 'group-1', name: 'Group 1', roles: ['form_admin', 'form_designer'] },
        { id: 'group-2', name: 'Group 2', roles: ['submission_reviewer'] },
      ]);
      expect(jwtService.getBearerToken).toHaveBeenCalledWith(req);
    });

    it('should include only non-deleted shared service roles', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).reply(200, {
        data: {
          groups: [
            {
              id: 'group-1',
              name: 'Group 1',
              sharedServiceRoles: [
                { name: 'form_admin', isDeleted: false },
                { name: 'form_designer', isDeleted: true },
              ],
            },
          ],
        },
      });

      const groups = await tenantService.getUserTenantGroupsAndRoles(req, tenantId);

      expect(groups).toEqual([{ id: 'group-1', name: 'Group 1', roles: ['form_admin'] }]);
    });

    it('should return empty array when no groups in response', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).reply(200, { data: {} });

      const groups = await tenantService.getUserTenantGroupsAndRoles(req, tenantId);

      expect(groups).toEqual([]);
    });

    it('should handle groups without sharedServiceRoles', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).reply(200, {
        data: {
          groups: [{ id: 'group-1', name: 'Group 1' }],
        },
      });

      const groups = await tenantService.getUserTenantGroupsAndRoles(req, tenantId);

      expect(groups).toEqual([{ id: 'group-1', name: 'Group 1', roles: [] }]);
    });

    it('should throw error on axios network error', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).networkError();

      await expect(tenantService.getUserTenantGroupsAndRoles(req, tenantId)).rejects.toThrow();
    });

    it('should throw error on 401 unauthorized', async () => {
      jwtService.getBearerToken.mockReturnValue('invalid-token');
      mockAxios.onGet(apiUrl).reply(401, { error: 'Unauthorized' });

      await expect(tenantService.getUserTenantGroupsAndRoles(req, tenantId)).rejects.toThrow();
    });

    it('should throw error if no currentUser', async () => {
      await expect(tenantService.getUserTenantGroupsAndRoles({}, tenantId)).rejects.toThrow('TenantService: missing currentUser');
      expect(jwtService.getBearerToken).not.toHaveBeenCalled();
    });

    it('should throw error if no idpUserId', async () => {
      await expect(
        tenantService.getUserTenantGroupsAndRoles(
          {
            currentUser: { tenantId: '0d3f5d5f-1a2b-4c3d-9e8f-112233445566' },
          },
          tenantId
        )
      ).rejects.toThrow('TenantService: missing currentUser.idpUserId');
      expect(jwtService.getBearerToken).not.toHaveBeenCalled();
    });

    it('should throw error if no tenantId', async () => {
      await expect(
        tenantService.getUserTenantGroupsAndRoles({
          currentUser: { idpUserId: 'user-123' },
        })
      ).rejects.toThrow('TenantService: missing tenantId');
      expect(jwtService.getBearerToken).not.toHaveBeenCalled();
    });

    it('should throw error if tenantId is not a valid UUID', async () => {
      await expect(tenantService.getUserTenantGroupsAndRoles(req, 'not-a-uuid')).rejects.toThrow('TenantService: invalid tenantId');
      expect(jwtService.getBearerToken).not.toHaveBeenCalled();
    });

    it('should return empty array when groups is not an array', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).reply(200, { data: { groups: { id: 'group-1' } } });

      const groups = await tenantService.getUserTenantGroupsAndRoles(req, tenantId);

      expect(groups).toEqual([]);
    });
  });

  describe('getGroupsForCurrentTenant', () => {
    const tenantId = '0d3f5d5f-1a2b-4c3d-9e8f-112233445566';
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

    it('should return empty array when groups is not an array', async () => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      mockAxios.onGet(apiUrl).reply(200, { data: { groups: { id: 'group-1' } } });

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
    const tenantId = '0d3f5d5f-1a2b-4c3d-9e8f-112233445566';
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

    it('should degrade gracefully when getGroupsForCurrentTenant fails (CSTAR unavailable)', async () => {
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ formId, tenantId: tenantId }),
        }),
      });

      FormGroup.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([{ groupId: 'group-1' }]),
        }),
      });

      mockAxios.onGet(apiUrl).networkError();

      const result = await tenantService.getFormGroups(req, formId);
      expect(result.associatedGroups).toEqual([]);
      expect(result.availableGroups).toEqual([]);
      expect(result.missingGroups).toEqual([
        {
          id: 'group-1',
          name: 'Group no longer available',
          description: 'This group may have been deleted from the tenant',
          isAssociated: true,
          isDeleted: true,
        },
      ]);
    });
  });

  describe('assignGroupsToForm', () => {
    const userId = 'user-123';
    const tenantId = '0d3f5d5f-1a2b-4c3d-9e8f-112233445566';
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
    const tenantGroupsUrl = `${endpoint}${listGroupsForTenant.replace('{tenantId}', tenantId)}`;

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
              sharedServiceRoles: [{ name: 'form_admin', isDeleted: false }],
            },
          ],
        },
      });
      mockAxios.onGet(tenantGroupsUrl).reply(200, {
        data: {
          groups: [
            { id: 'group-1', name: 'Admin Group' },
            { id: 'group-2', name: 'Regular Group' },
          ],
        },
      });

      const mockDeleteWhere = jest.fn().mockResolvedValue(true);
      const mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });
      const mockInsert = jest.fn().mockResolvedValue(true);

      FormGroup.query.mockImplementation(() => ({
        delete: mockDelete,
        insert: mockInsert,
      }));
      FormGroup.transaction = jest.fn(async (callback) => {
        await callback({});
      });

      const result = await tenantService.assignGroupsToForm(req, formId, groupIds);

      expect(result).toBe(true);
      expect(FormGroup.transaction).toHaveBeenCalled();
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

    it('should throw error when no assigned group has form_admin role', async () => {
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
              sharedServiceRoles: [{ name: 'form_admin', isDeleted: false }],
            },
          ],
        },
      });
      mockAxios.onGet(tenantGroupsUrl).reply(200, {
        data: {
          groups: [{ id: 'group-1', name: 'Regular Group' }],
        },
      });

      await expect(tenantService.assignGroupsToForm(req, formId, [])).rejects.toThrow('TenantService: at least one assigned group must have form_admin role');
    });

    it('should throw error when assigned groups do not include a tenant form_admin group', async () => {
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
              sharedServiceRoles: [{ name: 'form_admin', isDeleted: false }],
            },
          ],
        },
      });
      mockAxios.onGet(tenantGroupsUrl).reply(200, {
        data: {
          groups: [{ id: 'group-1', name: 'Admin Group' }],
        },
      });

      await expect(tenantService.assignGroupsToForm(req, formId, groupIds)).rejects.toThrow('TenantService: invalid groupIds');
    });

    it('should throw error when any assigned group is not in the tenant', async () => {
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
              sharedServiceRoles: [{ name: 'form_admin', isDeleted: false }],
            },
          ],
        },
      });
      mockAxios.onGet(tenantGroupsUrl).reply(200, {
        data: {
          groups: [{ id: 'group-1', name: 'Admin Group' }],
        },
      });

      await expect(tenantService.assignGroupsToForm(req, formId, ['group-1', 'group-unknown'])).rejects.toThrow('TenantService: invalid groupIds');
    });

    it('should deduplicate groupIds before insert', async () => {
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
              sharedServiceRoles: [{ name: 'form_admin', isDeleted: false }],
            },
          ],
        },
      });
      mockAxios.onGet(tenantGroupsUrl).reply(200, {
        data: {
          groups: [
            { id: 'group-1', name: 'Admin Group' },
            { id: 'group-2', name: 'Regular Group' },
          ],
        },
      });

      const mockDelete = jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(true) });
      const mockInsert = jest.fn().mockResolvedValue(true);

      FormGroup.query.mockImplementation(() => ({
        delete: mockDelete,
        insert: mockInsert,
      }));
      FormGroup.transaction = jest.fn(async (callback) => {
        await callback({});
      });

      const duplicateGroupIds = ['group-1', 'group-1', 'group-2'];
      const result = await tenantService.assignGroupsToForm(req, formId, duplicateGroupIds);

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ groupId: 'group-1' }), expect.objectContaining({ groupId: 'group-2' })]));
      expect(mockInsert.mock.calls[0][0]).toHaveLength(2);
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
              sharedServiceRoles: [{ name: 'form_admin', isDeleted: false }],
            },
          ],
        },
      });
      mockAxios.onGet(tenantGroupsUrl).reply(200, {
        data: {
          groups: [
            { id: 'group-1', name: 'Admin Group' },
            { id: 'group-2', name: 'Regular Group' },
          ],
        },
      });

      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockRejectedValue(new Error('DB delete error')),
      });

      FormGroup.query.mockImplementation(() => ({
        delete: mockDelete,
        insert: jest.fn(),
      }));
      FormGroup.transaction = jest.fn(async (callback) => {
        await callback({});
      });

      await expect(tenantService.assignGroupsToForm(req, formId, groupIds)).rejects.toThrow('DB delete error');
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
              sharedServiceRoles: [{ name: 'form_designer', isDeleted: false }],
            },
          ],
        },
      });

      await expect(tenantService.assignGroupsToForm(req, formId, groupIds)).rejects.toThrow('TenantService: insufficient permissions');
    });
  });

  describe('getUserRolesAndPermissionsForForm', () => {
    const userId = 'user-123';
    const tenantId = '0d3f5d5f-1a2b-4c3d-9e8f-112233445566';
    const userInfo = {
      idpUserId: userId,
      tenantId: tenantId,
    };
    const headers = { authorization: 'Bearer testtoken' };
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
            code: 'form_designer',
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
                { name: 'form_admin', isDeleted: false },
                { name: 'form_designer', isDeleted: false },
              ],
            },
          ],
        },
      });

      const result = await tenantService.getUserRolesAndPermissionsForForm(userInfo, headers, ['group-1'], tenantId);

      expect(result.roles).toEqual(['form_admin', 'form_designer']);
      expect(result.permissions).toEqual(expect.arrayContaining(['form_read', 'form_update', 'form_delete']));
      expect(result.permissions.length).toBe(3);
    });

    it('should return empty arrays when user has no groups', async () => {
      Role.query.mockReturnValue({
        withGraphFetched: jest.fn().mockResolvedValue([]),
      });
      mockAxios.onGet(apiUrl).reply(200, { data: { groups: [] } });

      const result = await tenantService.getUserRolesAndPermissionsForForm(userInfo, headers, [], tenantId);

      expect(result.roles).toEqual([]);
      expect(result.permissions).toEqual([]);
    });

    it('should return empty arrays when user groups do not match form groups', async () => {
      Role.query.mockReturnValue({
        withGraphFetched: jest.fn().mockResolvedValue([{ code: 'form_admin', permissions: [{ code: 'form_read' }] }]),
      });
      mockAxios.onGet(apiUrl).reply(200, {
        data: { groups: [{ id: 'group-1', name: 'Admin Group', sharedServiceRoles: [{ name: 'form_admin', isDeleted: false }] }] },
      });

      const result = await tenantService.getUserRolesAndPermissionsForForm(userInfo, headers, ['different-group-id'], tenantId);

      expect(result.roles).toEqual([]);
      expect(result.permissions).toEqual([]);
    });

    it('should throw error if no userInfo', async () => {
      await expect(tenantService.getUserRolesAndPermissionsForForm(null)).rejects.toThrow('TenantService: missing userInfo');
    });

    it('should throw error if no idpUserId', async () => {
      await expect(tenantService.getUserRolesAndPermissionsForForm({ tenantId }, headers, [], tenantId)).rejects.toThrow('TenantService: missing userInfo.idpUserId');
    });

    it('should throw error if no tenantId', async () => {
      await expect(tenantService.getUserRolesAndPermissionsForForm({ idpUserId: userId }, headers, [])).rejects.toThrow('TenantService: missing tenantId');
    });

    it('should throw error if tenantId is not a valid UUID', async () => {
      await expect(tenantService.getUserRolesAndPermissionsForForm(userInfo, headers, [], 'not-a-uuid')).rejects.toThrow('TenantService: invalid tenantId');
    });

    it('should throw error if headers are missing', async () => {
      await expect(tenantService.getUserRolesAndPermissionsForForm(userInfo, null, [], tenantId)).rejects.toThrow('TenantService: missing headers for tenant API authentication');
    });

    it('should throw error when Role query fails', async () => {
      Role.query.mockReturnValue({
        withGraphFetched: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await expect(tenantService.getUserRolesAndPermissionsForForm(userInfo, headers, [], tenantId)).rejects.toThrow('DB error');
    });

    it('should throw error when getUserTenantGroupsAndRoles fails', async () => {
      Role.query.mockReturnValue({
        withGraphFetched: jest.fn().mockResolvedValue([]),
      });
      mockAxios.onGet(apiUrl).networkError();

      await expect(tenantService.getUserRolesAndPermissionsForForm(userInfo, headers, [], tenantId)).rejects.toThrow();
    });
  });

  describe('canCreateForm', () => {
    const userId = 'user-123';
    const tenantId = '0d3f5d5f-1a2b-4c3d-9e8f-112233445566';
    const apiUrl = `${endpoint}${listGroupsForUserForTenantPath.replace('{tenantId}', tenantId).replace('{userId}', userId)}`;

    const primaryProviders = [
      { code: 'idir', primary: true, extra: { sortOrder: 10 } },
      { code: 'azureidir', primary: true, extra: { canonicalCode: 'idir', sortOrder: 10 } },
    ];

    beforeEach(() => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
      idpService.getIdentityProviders = jest.fn().mockResolvedValue(primaryProviders);
    });

    it('should return true for IDIR user without tenantId', async () => {
      const req = { currentUser: { idpHint: 'idir', idpUserId: userId } };

      const result = await tenantService.canCreateForm(req);
      expect(result).toBe(true);
    });

    it('should return true for IDIR MFA (azureidir) user without tenantId', async () => {
      const req = { currentUser: { idpHint: 'idir', idpUserId: userId } };

      const result = await tenantService.canCreateForm(req);
      expect(result).toBe(true);
    });

    it('should return true for IDIR user with tenantId and form_admin role', async () => {
      const req = { currentUser: { idpHint: 'idir', idpUserId: userId, tenantId } };

      mockAxios.onGet(apiUrl).reply(200, {
        data: {
          groups: [{ id: 'group-1', name: 'Admin Group', sharedServiceRoles: [{ name: 'form_admin', isDeleted: false }] }],
        },
      });

      const result = await tenantService.canCreateForm(req);
      expect(result).toBe(true);
    });

    it('should return false for IDIR user with tenantId but no form_admin role', async () => {
      const req = { currentUser: { idpHint: 'idir', idpUserId: userId, tenantId } };

      mockAxios.onGet(apiUrl).reply(200, {
        data: {
          groups: [{ id: 'group-1', name: 'Regular Group', sharedServiceRoles: [{ name: 'form_designer', isDeleted: false }] }],
        },
      });

      const result = await tenantService.canCreateForm(req);
      expect(result).toBe(false);
    });

    it('should return false for non-IDIR user', async () => {
      const req = { currentUser: { idpHint: 'bceid', idpUserId: userId } };

      const result = await tenantService.canCreateForm(req);
      expect(result).toBe(false);
    });

    it('should throw error if no currentUser', async () => {
      await expect(tenantService.canCreateForm({})).rejects.toThrow('TenantService: missing currentUser');
    });

    it('should throw error when getUserTenantGroupsAndRoles fails', async () => {
      const req = { currentUser: { idpHint: 'idir', idpUserId: userId, tenantId } };

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
      const req = { currentUser: { tenantId: '0d3f5d5f-1a2b-4c3d-9e8f-112233445566' } };

      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ formId: formId, tenantId: '0d3f5d5f-1a2b-4c3d-9e8f-112233445566' }),
        }),
      });

      const result = await tenantService.isFormInUsersTenant(req, formId);
      expect(result).toBe(true);
    });

    it('should return false when form does not belong to user tenant', async () => {
      const req = { currentUser: { tenantId: '0d3f5d5f-1a2b-4c3d-9e8f-112233445566' } };

      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await tenantService.isFormInUsersTenant(req, formId);
      expect(result).toBe(false);
    });

    it('should return false for invalid formId', async () => {
      const req = { currentUser: { tenantId: '0d3f5d5f-1a2b-4c3d-9e8f-112233445566' } };

      const result = await tenantService.isFormInUsersTenant(req, 'invalid-uuid');
      expect(result).toBe(false);
    });

    it('should throw error if no currentUser', async () => {
      await expect(tenantService.isFormInUsersTenant({}, formId)).rejects.toThrow('TenantService: missing currentUser');
    });

    it('should throw error on database error', async () => {
      const req = { currentUser: { tenantId: '0d3f5d5f-1a2b-4c3d-9e8f-112233445566' } };

      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockRejectedValue(new Error('DB error')),
        }),
      });

      await expect(tenantService.isFormInUsersTenant(req, formId)).rejects.toThrow('DB error');
    });
  });

  describe('getTenantUsers', () => {
    const tenantId = '0d3f5d5f-1a2b-4c3d-9e8f-112233445566';
    const listTenantUsersPath = config.get('cstar.listTenantUsersPath');
    const req = {
      currentUser: { tenantId },
      headers: { authorization: 'Bearer testtoken' },
    };
    const apiUrl = `${endpoint}${listTenantUsersPath.replace('{tenantId}', tenantId)}`;

    beforeEach(() => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
    });

    it('should return users from data.data.users', async () => {
      mockAxios.onGet(apiUrl).reply(200, {
        data: {
          users: [
            { id: 'u1', username: 'alpha' },
            { id: 'u2', username: 'beta' },
          ],
        },
      });

      const users = await tenantService.getTenantUsers(req);

      expect(users).toEqual([
        { id: 'u1', username: 'alpha' },
        { id: 'u2', username: 'beta' },
      ]);
    });

    it('should return users from data.users fallback', async () => {
      mockAxios.onGet(apiUrl).reply(200, {
        users: [{ id: 'u3', username: 'gamma' }],
      });

      const users = await tenantService.getTenantUsers(req);

      expect(users).toEqual([{ id: 'u3', username: 'gamma' }]);
    });

    it('should return empty array when users missing', async () => {
      mockAxios.onGet(apiUrl).reply(200, {});

      const users = await tenantService.getTenantUsers(req);

      expect(users).toEqual([]);
    });

    it('should throw error if no currentUser', async () => {
      await expect(tenantService.getTenantUsers({})).rejects.toThrow('TenantService: missing currentUser');
    });

    it('should throw error if no tenantId', async () => {
      await expect(tenantService.getTenantUsers({ currentUser: {} })).rejects.toThrow('TenantService: missing currentUser.tenantId');
    });

    it('should throw error when tenant users API fails', async () => {
      mockAxios.onGet(apiUrl).reply(401, { error: 'Unauthorized' });

      await expect(tenantService.getTenantUsers(req)).rejects.toThrow();
    });
  });

  describe('isUserInFormGroups', () => {
    const formId = 'form-abc';
    const tenantId = '0d3f5d5f-1a2b-4c3d-9e8f-112233445566';
    const targetEmail = 'target@example.com';
    const req = { headers: { authorization: 'Bearer testtoken' }, currentUser: {} };
    const listTenantUsersPath = config.get('cstar.listTenantUsersPath');
    const apiUrl = `${endpoint}${listTenantUsersPath.replace('{tenantId}', tenantId)}`;
    beforeEach(() => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
    });

    it('should return null when classic CHEFS form has no group assignments and no tenant record', async () => {
      FormGroup.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([]),
        }),
      });
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await tenantService.isUserInFormGroups(req, formId, targetEmail);

      expect(result).toBeNull();
    });

    it('should return true when tenanted form has no group assignments (no group restriction)', async () => {
      FormGroup.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([]),
        }),
      });
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ formId, tenantId }),
        }),
      });

      const result = await tenantService.isUserInFormGroups(req, formId, targetEmail);

      expect(result).toBe(true);
    });

    it('should return null when form has no tenant record', async () => {
      FormGroup.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([{ groupId: 'group-1' }]),
        }),
      });
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await tenantService.isUserInFormGroups(req, formId, targetEmail);

      expect(result).toBeNull();
    });

    it('should return false when target user is not found in CHEFS DB', async () => {
      FormGroup.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([{ groupId: 'group-1' }]),
        }),
      });
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ formId, tenantId }),
        }),
      });
      User.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await tenantService.isUserInFormGroups(req, formId, targetEmail);

      expect(result).toBe(false);
    });

    it('should return true when target user is in one of the form groups', async () => {
      FormGroup.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([{ groupId: 'group-1' }, { groupId: 'group-2' }]),
        }),
      });
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ formId, tenantId }),
        }),
      });
      User.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ idpUserId: 'target-sso-id' }),
        }),
      });
      mockAxios.onGet(apiUrl).reply(200, {
        data: { users: [{ ssoUser: { ssoUserId: 'target-sso-id' } }, { ssoUser: { ssoUserId: 'other-sso-id' } }] },
      });

      const result = await tenantService.isUserInFormGroups(req, formId, targetEmail);

      expect(result).toBe(true);
    });

    it('should return false when target user is not in any form group', async () => {
      FormGroup.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([{ groupId: 'group-1' }, { groupId: 'group-2' }]),
        }),
      });
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ formId, tenantId }),
        }),
      });
      User.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ idpUserId: 'target-sso-id' }),
        }),
      });
      mockAxios.onGet(apiUrl).reply(200, {
        data: { users: [{ ssoUser: { ssoUserId: 'other-sso-id' } }] },
      });

      const result = await tenantService.isUserInFormGroups(req, formId, targetEmail);

      expect(result).toBe(false);
    });

    it('should return false when CSTAR API throws', async () => {
      FormGroup.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([{ groupId: 'group-1' }]),
        }),
      });
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ formId, tenantId }),
        }),
      });
      User.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ idpUserId: 'target-sso-id' }),
        }),
      });
      mockAxios.onGet(apiUrl).reply(500, { error: 'Internal Server Error' });

      const result = await tenantService.isUserInFormGroups(req, formId, targetEmail);

      expect(result).toBe(false);
    });

    it('should call CSTAR users endpoint with form groupIds as query param', async () => {
      FormGroup.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([{ groupId: 'group-1' }]),
        }),
      });
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ formId, tenantId }),
        }),
      });
      User.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ idpUserId: 'target-sso-id' }),
        }),
      });
      mockAxios.onGet(apiUrl).reply(200, { data: { users: [] } });

      await tenantService.isUserInFormGroups(req, formId, targetEmail);

      expect(mockAxios.history.get).toHaveLength(1);
      expect(mockAxios.history.get[0].url).toBe(apiUrl);
      expect(mockAxios.history.get[0].params).toEqual({ groupIds: 'group-1' });
    });
  });

  describe('getUsersForForm', () => {
    const formId = 'form-abc';
    const tenantId = '0d3f5d5f-1a2b-4c3d-9e8f-112233445566';
    const req = {
      headers: { authorization: 'Bearer testtoken' },
      currentUser: { idpUserId: 'user-123' },
    };

    beforeEach(() => {
      jwtService.getBearerToken.mockReturnValue('testtoken');
    });

    it('should return null when classic CHEFS form has no group assignments and no tenant record', async () => {
      FormGroup.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([]),
        }),
      });
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await tenantService.getUsersForForm(req, formId);

      expect(result).toBeNull();
    });

    it('should call getTenantUsers when tenanted form has no group assignments', async () => {
      const users = [{ id: 'u1' }];
      FormGroup.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([]),
        }),
      });
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ formId, tenantId }),
        }),
      });
      jest.spyOn(tenantService, 'getTenantUsers').mockResolvedValue(users);

      const result = await tenantService.getUsersForForm(req, formId);

      expect(tenantService.getTenantUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          currentUser: expect.objectContaining({ tenantId }),
        })
      );
      expect(result).toEqual(users);
    });

    it('should return null when form has no tenant record', async () => {
      FormGroup.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([{ groupId: 'group-1' }]),
        }),
      });
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await tenantService.getUsersForForm(req, formId);

      expect(result).toBeNull();
    });

    it('should call getTenantUsers with the form tenant id injected into req', async () => {
      const users = [{ id: 'u1' }];
      FormGroup.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([{ groupId: 'group-1' }]),
        }),
      });
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ formId, tenantId }),
        }),
      });
      jest.spyOn(tenantService, 'getTenantUsers').mockResolvedValue(users);

      const result = await tenantService.getUsersForForm(req, formId);

      expect(tenantService.getTenantUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          currentUser: expect.objectContaining({ tenantId }),
        })
      );
      expect(result).toEqual(users);
    });

    it('should propagate errors thrown by getTenantUsers', async () => {
      FormGroup.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([{ groupId: 'group-1' }]),
        }),
      });
      FormTenant.query.mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ formId, tenantId }),
        }),
      });
      jest.spyOn(tenantService, 'getTenantUsers').mockRejectedValue(new Error('CSTAR error'));

      await expect(tenantService.getUsersForForm(req, formId)).rejects.toThrow('CSTAR error');
    });
  });
});
