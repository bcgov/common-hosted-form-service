const controller = require('../../../../src/forms/rbac/controller');
const service = require('../../../../src/forms/rbac/service');
const emailService = require('../../../../src/forms/email/emailService');
const formService = require('../../../../../app/src/forms/submission/service');
const tenantService = require('../../../../src/components/tenantService');
const userService = require('../../../../src/forms/user/service');

jest.mock('../../../../src/forms/rbac/service');
jest.mock('../../../../src/components/tenantService');
jest.mock('../../../../src/forms/user/service');

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getSubmissionUsers', () => {
  const req = {
    query: { formSubmissionId: '1', userId: '2' },
    body: { permissions: [] },
    currentUser: {},
    headers: { referer: 'a' },
  };
  it('should call the service with the query params', async () => {
    service.getSubmissionUsers = jest.fn().mockReturnValue({ form: { id: '123' } });
    await controller.getSubmissionUsers(req, {}, jest.fn());

    expect(service.getSubmissionUsers).toBeCalledTimes(1);
    expect(service.getSubmissionUsers).toBeCalledWith(req.query);
  });
});

describe('setSubmissionUserPermissions', () => {
  const req = {
    query: { formSubmissionId: '1', userId: '2', selectedUserEmail: 'a@a.com' },
    body: { permissions: [1, 2, 3] },
    currentUser: { me: 'I' },
    headers: { referer: 'a' },
  };
  it('should call the service with the appropriate request stuff', async () => {
    formService.read = jest.fn().mockReturnValue({ form: { id: '123' } });
    service.modifySubmissionUser = jest.fn().mockReturnValue({ form: { id: '123' } });
    emailService.submissionAssigned = jest.fn().mockReturnValue({});
    await controller.setSubmissionUserPermissions(req, {}, jest.fn());

    expect(service.modifySubmissionUser).toBeCalledTimes(1);
    expect(service.modifySubmissionUser).toBeCalledWith(req.query.formSubmissionId, req.query.userId, req.body, req.currentUser);
  });
});

describe('getCurrentUserForms', () => {
  const req = {
    query: { formId: '1' },
    body: { permissions: [] },
    currentUser: {},
    headers: { referer: 'a' },
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const next = jest.fn();

  it('should call the service with currentUser, query and headers', async () => {
    service.getCurrentUserForms = jest.fn().mockResolvedValue([]);

    await controller.getCurrentUserForms(req, res, next);

    expect(service.getCurrentUserForms).toBeCalledTimes(1);
    expect(service.getCurrentUserForms).toBeCalledWith(req.currentUser, req.query, req.headers);
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith([]);
    expect(next).not.toBeCalled();
  });
});

describe('getFormUsers', () => {
  let res;
  let next;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should use local service when current user has no tenantId', async () => {
    const req = {
      query: { formId: 'form-1' },
      currentUser: {},
    };
    const users = [{ userId: 'user-1' }];
    service.getFormUsers = jest.fn().mockResolvedValue(users);

    await controller.getFormUsers(req, res, next);

    expect(service.getFormUsers).toHaveBeenCalledWith(req.query);
    expect(tenantService.getTenantUsers).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(users);
    expect(next).not.toHaveBeenCalled();
  });

  it('should use tenant users and map response when current user has tenantId', async () => {
    const req = {
      query: { formId: 'form-1' },
      currentUser: { tenantId: 'tenant-1' },
    };
    const tenantUsers = [
      {
        id: 'tenant-user-id',
        isDeleted: false,
        ssoUser: {
          ssoUserId: 'kc-1',
          idpType: 'idir',
          userName: 'idir\\john',
          displayName: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      },
    ];
    tenantService.getTenantUsers = jest.fn().mockResolvedValue(tenantUsers);
    userService.readByKeycloakId = jest.fn().mockResolvedValue({ id: 'db-user-id' });

    await controller.getFormUsers(req, res, next);

    expect(tenantService.getTenantUsers).toHaveBeenCalledWith(req);
    expect(userService.readByKeycloakId).toHaveBeenCalledWith('kc-1');
    expect(service.getFormUsers).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        userId: 'db-user-id',
        idpUserId: 'kc-1',
        username: 'idir\\john',
        fullName: 'John Doe',
        email: 'john@example.com',
        user_idpCode: 'idir',
        identityProviders: ['idir'],
        form_login_required: ['idir'],
        idps: ['idir'],
        active: true,
      }),
    ]);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next when tenant user lookup fails', async () => {
    const req = {
      query: { formId: 'form-1' },
      currentUser: { tenantId: 'tenant-1' },
    };
    const error = new Error('tenant fail');
    tenantService.getTenantUsers = jest.fn().mockRejectedValue(error);

    await controller.getFormUsers(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('controller.isUserPartOfFormTeams', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      query: {
        formId: '3d338420-b272-4b4b-8b08-756ed5b1576c',
        email: 'test@gg.com',
        roles: '*',
        active: true,
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  it('responds with 200 and the service result', async () => {
    const mockResult = true;
    service.getFormUsers.mockResolvedValue(mockResult);

    await controller.isUserPartOfFormTeams(req, res, next);

    expect(service.getFormUsers).toHaveBeenCalledWith(req.query);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResult);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const error = new Error('Oops');
    service.getFormUsers.mockRejectedValue(error);

    await controller.isUserPartOfFormTeams(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe('getCurrentUserTenants', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      currentUser: { idpUserId: 'user-123' },
      headers: { authorization: 'Bearer testtoken' },
    };
    res = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should call tenantService.getCurrentUserTenants and return tenants', async () => {
    const tenants = [{ id: 't1', name: 'Tenant 1' }];
    tenantService.getCurrentUserTenants.mockResolvedValue(tenants);

    await controller.getCurrentUserTenants(req, res, next);

    expect(tenantService.getCurrentUserTenants).toHaveBeenCalledWith(req);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(tenants);
    expect(next).not.toHaveBeenCalled();
  });

  it('should set degraded header when tenant service degrades', async () => {
    const tenants = [{ id: 't1', name: 'Tenant 1' }];
    tenantService.getCurrentUserTenants.mockImplementation(async (request) => {
      request._tenantServiceDegraded = true;
      return tenants;
    });

    await controller.getCurrentUserTenants(req, res, next);

    expect(res.set).toHaveBeenCalledWith('X-Tenant-Service-Status', 'degraded');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(tenants);
  });

  it('should return empty array if no currentUser or idpUserId', async () => {
    req.currentUser = null;

    await controller.getCurrentUserTenants(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
    expect(tenantService.getCurrentUserTenants).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with error on failure', async () => {
    const error = new Error('fail');
    tenantService.getCurrentUserTenants.mockRejectedValue(error);

    await controller.getCurrentUserTenants(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalledWith(200);
  });
});

describe('getGroupsForCurrentTenant', () => {
  it('should return groups from tenantService', async () => {
    const req = { currentUser: { tenantId: 'tenant-1' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const groups = [{ id: 'group-1' }];
    tenantService.getGroupsForCurrentTenant = jest.fn().mockResolvedValue(groups);

    await controller.getGroupsForCurrentTenant(req, res, next);

    expect(tenantService.getGroupsForCurrentTenant).toHaveBeenCalledWith(req);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(groups);
    expect(next).not.toHaveBeenCalled();
  });

  it('should forward errors to next', async () => {
    const req = { currentUser: { tenantId: 'tenant-1' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const error = new Error('fail');
    tenantService.getGroupsForCurrentTenant = jest.fn().mockRejectedValue(error);

    await controller.getGroupsForCurrentTenant(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('assignGroupsToForm', () => {
  it('should return 400 when groupIds is missing or invalid', async () => {
    const req = {
      params: { formId: 'form-1' },
      body: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await controller.assignGroupsToForm(req, res, next);

    expect(tenantService.assignGroupsToForm).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'groupIds must be an array' });
  });

  it('should call tenantService.assignGroupsToForm and return success', async () => {
    const req = {
      params: { formId: 'form-1' },
      body: { groupIds: ['group-1', 'group-2'] },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    tenantService.assignGroupsToForm = jest.fn().mockResolvedValue(true);

    await controller.assignGroupsToForm(req, res, next);

    expect(tenantService.assignGroupsToForm).toHaveBeenCalledWith(req, 'form-1', ['group-1', 'group-2']);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });

  it('should forward errors to next', async () => {
    const req = {
      params: { formId: 'form-1' },
      body: { groupIds: ['group-1'] },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const error = new Error('assign fail');
    tenantService.assignGroupsToForm = jest.fn().mockRejectedValue(error);

    await controller.assignGroupsToForm(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('getFormGroups', () => {
  it('should return form groups from tenantService', async () => {
    const req = { params: { formId: 'form-1' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const groups = [{ id: 'group-1' }];
    tenantService.getFormGroups = jest.fn().mockResolvedValue(groups);

    await controller.getFormGroups(req, res, next);

    expect(tenantService.getFormGroups).toHaveBeenCalledWith(req, 'form-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(groups);
    expect(next).not.toHaveBeenCalled();
  });

  it('should forward errors to next', async () => {
    const req = { params: { formId: 'form-1' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const error = new Error('group fail');
    tenantService.getFormGroups = jest.fn().mockRejectedValue(error);

    await controller.getFormGroups(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
