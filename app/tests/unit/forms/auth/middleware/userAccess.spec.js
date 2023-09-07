const { currentUser, hasFormPermissions, hasSubmissionPermissions, hasFormRoles, hasRolePermissions } = require('../../../../../src/forms/auth/middleware/userAccess');

const keycloak = require('../../../../../src/components/keycloak');
const Problem = require('api-problem');
const service = require('../../../../../src/forms/auth/service');
const rbacService = require('../../../../../src/forms/rbac/service');

const kauth = {
  grant: {
    access_token: 'fsdfhsd08f0283hr',
  },
};

const userId = 'c6455376-382c-439d-a811-0381a012d695';
const userId2 = 'c6455376-382c-439d-a811-0381a012d696';
const formId = 'c6455376-382c-439d-a811-0381a012d697';

const Roles = {
  OWNER: 'owner',
  TEAM_MANAGER: 'team_manager',
  FORM_DESIGNER: 'form_designer',
  SUBMISSION_REVIEWER: 'submission_reviewer',
  FORM_SUBMITTER: 'form_submitter',
};

// Mock the token validation in the KC lib
keycloak.grantManager.validateAccessToken = jest.fn().mockReturnValue('yeah ok');

// Mock the service login
const mockUser = { user: 'me' };
service.login = jest.fn().mockReturnValue(mockUser);

const testRes = {
  writeHead: jest.fn(),
  end: jest.fn(),
};

afterEach(() => {
  jest.clearAllMocks();
});

describe('currentUser', () => {
  it('gets the current user with valid request', async () => {
    const testReq = {
      params: {
        formId: 2,
      },
      headers: {
        authorization: 'Bearer hjvds0uds',
      },
      kauth: kauth,
    };

    const nxt = jest.fn();

    await currentUser(testReq, testRes, nxt);
    expect(keycloak.grantManager.validateAccessToken).toHaveBeenCalledTimes(1);
    expect(keycloak.grantManager.validateAccessToken).toHaveBeenCalledWith('hjvds0uds');
    expect(service.login).toHaveBeenCalledTimes(1);
    expect(service.login).toHaveBeenCalledWith(kauth.grant.access_token, { formId: 2 });
    expect(testReq.currentUser).toEqual(mockUser);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });

  it('prioritizes the url param if both url and query are provided', async () => {
    const testReq = {
      params: {
        formId: 2,
      },
      query: {
        formId: 99,
      },
      headers: {
        authorization: 'Bearer hjvds0uds',
      },
      kauth: kauth,
    };

    await currentUser(testReq, testRes, jest.fn());
    expect(service.login).toHaveBeenCalledWith(kauth.grant.access_token, { formId: 2 });
  });

  it('uses the query param if both if that is whats provided', async () => {
    const testReq = {
      query: {
        formId: 99,
      },
      headers: {
        authorization: 'Bearer hjvds0uds',
      },
      kauth: kauth,
    };

    await currentUser(testReq, testRes, jest.fn());
    expect(service.login).toHaveBeenCalledWith(kauth.grant.access_token, { formId: 99 });
  });

  it('403s if the token is invalid', async () => {
    const testReq = {
      headers: {
        authorization: 'Bearer hjvds0uds',
      },
    };

    const nxt = jest.fn();
    keycloak.grantManager.validateAccessToken = jest.fn().mockReturnValue(undefined);

    await currentUser(testReq, testRes, nxt);
    expect(keycloak.grantManager.validateAccessToken).toHaveBeenCalledTimes(1);
    expect(keycloak.grantManager.validateAccessToken).toHaveBeenCalledWith('hjvds0uds');
    expect(service.login).toHaveBeenCalledTimes(0);
    expect(testReq.currentUser).toEqual(undefined);
    expect(nxt).toHaveBeenCalledTimes(0);
    // expect(nxt).toHaveBeenCalledWith(new Problem(403, { detail: 'Authorization token is invalid.' }));
  });
});

describe('getToken', () => {
  it('returns a null token if no kauth in the request', async () => {
    const testReq = {
      params: {
        formId: 2,
      },
    };

    await currentUser(testReq, testRes, jest.fn());
    expect(service.login).toHaveBeenCalledTimes(1);
    expect(service.login).toHaveBeenCalledWith(null, { formId: 2 });
  });
});

describe('hasFormPermissions', () => {
  it('returns a middleware function', async () => {
    const mw = hasFormPermissions(['abc']);
    expect(mw).toBeInstanceOf(Function);
  });

  it('401s if the request has no current user', async () => {
    const mw = hasFormPermissions(['abc']);
    const nxt = jest.fn();
    const req = { a: '1' };

    mw(req, testRes, nxt);
    expect(nxt).toHaveBeenCalledTimes(0);
    // expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'Current user not found on request.' }));
  });

  it('401s if the request has no formId', async () => {
    const mw = hasFormPermissions(['abc']);
    const nxt = jest.fn();
    const req = {
      currentUser: {
        forms: 1,
      },
      params: {
        submissionId: 123,
      },
      query: {
        otherQueryThing: 'abc',
      },
    };

    mw(req, testRes, nxt);
    expect(nxt).toHaveBeenCalledTimes(0);
    // expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'Form Id not found on request.' }));
  });

  it('401s if the user does not have access to the form', async () => {
    const mw = hasFormPermissions(['abc']);
    const nxt = jest.fn();
    const req = {
      currentUser: {
        forms: [
          {
            formId: '456',
          },
          {
            formId: '789',
          },
        ],
      },
      params: {
        formId: '123',
      },
    };

    mw(req, testRes, nxt);
    expect(nxt).toHaveBeenCalledTimes(0);
    // expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'Current user has no access to form.' }));
  });

  it('401s if the user does not have access to the form nor is it in their deleted', async () => {
    const mw = hasFormPermissions(['abc']);
    const nxt = jest.fn();
    const req = {
      currentUser: {
        forms: [
          {
            formId: '456',
          },
          {
            formId: '789',
          },
        ],
        deletedForms: [
          {
            formId: '888',
          },
          {
            formId: '999',
          },
        ],
      },
      params: {
        formId: '123',
      },
    };

    mw(req, testRes, nxt);
    expect(nxt).toHaveBeenCalledTimes(0);
    // expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'Current user has no access to form.' }));
  });

  it('does not 401 if the user has deleted form access', async () => {
    const mw = hasFormPermissions(['abc']);
    const nxt = jest.fn();
    const req = {
      currentUser: {
        forms: [
          {
            formId: '456',
          },
          {
            formId: '789',
          },
        ],
        deletedForms: [
          {
            formId: '888',
          },
          {
            formId: '123',
            permissions: ['abc'],
          },
        ],
      },
      params: {
        formId: '123',
      },
    };

    mw(req, testRes, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });

  it('401s if the expected permissions are not included', async () => {
    const mw = hasFormPermissions(['FORM_READ', 'SUBMISSION_DELETE', 'DESIGN_CREATE']);
    const nxt = jest.fn();
    const req = {
      currentUser: {
        forms: [
          {
            formId: '456',
          },
          {
            formId: '123',
            permissions: ['FORM_READ', 'SUBMISSION_READ', 'DESIGN_CREATE'],
          },
        ],
      },
      params: {
        formId: '123',
      },
    };

    mw(req, testRes, nxt);
    expect(nxt).toHaveBeenCalledTimes(0);
    // expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'Current user does not have required permission(s) on form.' }));
  });

  it('401s if the expected permissions are not included (string, not array check)', async () => {
    const mw = hasFormPermissions('FORM_READ');
    const nxt = jest.fn();
    const req = {
      currentUser: {
        forms: [
          {
            formId: '456',
          },
          {
            formId: '123',
            permissions: ['FORM_DELETE'],
          },
        ],
      },
      params: {
        formId: '123',
      },
    };

    mw(req, testRes, nxt);
    expect(nxt).toHaveBeenCalledTimes(0);
    // expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'Current user does not have required permission(s) on form.' }));
  });

  it('moves on if the expected permissions are included', async () => {
    const mw = hasFormPermissions(['FORM_READ', 'SUBMISSION_DELETE', 'DESIGN_CREATE']);
    const nxt = jest.fn();
    const req = {
      currentUser: {
        forms: [
          {
            formId: '456',
          },
          {
            formId: '123',
            permissions: ['FORM_READ', 'SUBMISSION_DELETE', 'DESIGN_CREATE'],
          },
        ],
      },
      params: {
        formId: '123',
      },
    };

    mw(req, testRes, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });

  it('moves on if a valid API key user has already been set', async () => {
    const mw = hasFormPermissions(['abc']);
    const nxt = jest.fn();
    const req = {
      apiUser: 1,
    };

    mw(req, testRes, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });
});

describe('hasSubmissionPermissions', () => {
  it('returns a middleware function', () => {
    const mw = hasSubmissionPermissions(['abc']);
    expect(mw).toBeInstanceOf(Function);
  });

  it('moves on if a valid API key user has already been set', async () => {
    const mw = hasSubmissionPermissions(['abc']);
    const nxt = jest.fn();
    const req = {
      apiUser: 1,
    };

    mw(req, testRes, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });

  it('401s if the request has no formId', async () => {
    const mw = hasSubmissionPermissions(['abc']);
    const nxt = jest.fn();
    const req = {
      params: {
        formId: 123,
      },
      query: {
        otherQueryThing: 'abc',
      },
    };

    await mw(req, testRes, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'Submission Id not found on request.' }));
  });

  it('401s if the submission was deleted', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({ submission: { deleted: true } });

    const mw = hasSubmissionPermissions(['abc']);
    const nxt = jest.fn();
    const req = {
      params: {
        formSubmissionId: 123,
      },
    };

    await mw(req, testRes, nxt);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(1);
    expect(service.getSubmissionForm).toHaveBeenCalledWith(123);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'You do not have access to this submission.' }));
  });

  it('moves on if the form is public and you are only requesting read permission', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: { identityProviders: [{ code: 'random' }, { code: 'public' }] },
    });

    const mw = hasSubmissionPermissions('submission_read');
    const nxt = jest.fn();
    const req = {
      params: {
        formSubmissionId: 123,
      },
    };

    await mw(req, testRes, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });

  it('moves on if the form is public and you are only requesting read permission (only 1 idp)', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: { identityProviders: [{ code: 'public' }] },
    });

    const mw = hasSubmissionPermissions(['submission_read']);
    const nxt = jest.fn();
    const req = {
      params: {
        formSubmissionId: 123,
      },
    };

    await mw(req, testRes, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });

  it('does not allow public access if more than read permission is needed', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: { identityProviders: [{ code: 'public' }] },
    });
    service.checkSubmissionPermission = jest.fn().mockReturnValue(undefined);

    const mw = hasSubmissionPermissions(['submission_read', 'submission_delete']);
    const nxt = jest.fn();
    const req = {
      params: {
        formSubmissionId: 123,
      },
    };

    await mw(req, testRes, nxt);
    // just run to the end and fall into the base case
    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(1);
    expect(service.checkSubmissionPermission).toHaveBeenCalledWith(undefined, 123, ['submission_read', 'submission_delete']);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'You do not have access to this submission.' }));
  });

  it('does not allow public access if the form does not have the public idp', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: { identityProviders: [{ code: 'idir' }, { code: 'bceid' }] },
    });
    service.checkSubmissionPermission = jest.fn().mockReturnValue(undefined);

    const mw = hasSubmissionPermissions('submission_read');
    const nxt = jest.fn();
    const req = {
      params: {
        formSubmissionId: 123,
      },
    };

    await mw(req, testRes, nxt);
    // just run to the end and fall into the base case
    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(1);
    expect(service.checkSubmissionPermission).toHaveBeenCalledWith(undefined, 123, ['submission_read']);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'You do not have access to this submission.' }));
  });

  it('moves on if the permission check query succeeds', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: { identityProviders: [{ code: 'idir' }, { code: 'bceid' }] },
    });
    service.checkSubmissionPermission = jest.fn().mockReturnValue(true);

    const mw = hasSubmissionPermissions('submission_read');
    const nxt = jest.fn();
    const req = {
      params: {
        formSubmissionId: 123,
      },
    };

    await mw(req, testRes, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });

  it('falls through to the query if the current user has no forms', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: { identityProviders: [{ code: 'idir' }, { code: 'bceid' }] },
    });
    service.checkSubmissionPermission = jest.fn().mockReturnValue(undefined);

    const mw = hasSubmissionPermissions('submission_read');
    const nxt = jest.fn();
    const cu = {
      forms: [],
    };
    const req = {
      currentUser: cu,
      params: {
        formSubmissionId: 123,
      },
    };

    await mw(req, testRes, nxt);
    // just run to the end and fall into the base case
    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(1);
    expect(service.checkSubmissionPermission).toHaveBeenCalledWith(cu, 123, ['submission_read']);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'You do not have access to this submission.' }));
  });

  it('falls through to the query if the current user does not have any FORM access on the current form', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: { id: '999', identityProviders: [{ code: 'idir' }, { code: 'bceid' }] },
    });
    service.checkSubmissionPermission = jest.fn().mockReturnValue(undefined);

    const mw = hasSubmissionPermissions('submission_read');
    const nxt = jest.fn();
    const cu = {
      forms: [
        {
          formId: '456',
        },
        {
          formId: '789',
        },
      ],
    };
    const req = {
      currentUser: cu,
      params: {
        formSubmissionId: 123,
      },
    };

    await mw(req, testRes, nxt);
    // just run to the end and fall into the base case
    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(1);
    expect(service.checkSubmissionPermission).toHaveBeenCalledWith(cu, 123, ['submission_read']);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'You do not have access to this submission.' }));
  });

  it('falls through to the query if the current user does not have the expected permission for FORM access on the current form', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: {
        id: '999',
        identityProviders: [{ code: 'idir' }, { code: 'bceid' }],
      },
    });
    service.checkSubmissionPermission = jest.fn().mockReturnValue(undefined);

    const mw = hasSubmissionPermissions(['submission_delete', 'submission_create']);
    const nxt = jest.fn();
    const cu = {
      forms: [
        {
          formId: '456',
        },
        {
          formId: '999',
          permissions: ['submission_read', 'submission_update'],
        },
      ],
    };
    const req = {
      currentUser: cu,
      params: {
        formSubmissionId: 123,
      },
    };

    await mw(req, testRes, nxt);
    // just run to the end and fall into the base case
    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(1);
    expect(service.checkSubmissionPermission).toHaveBeenCalledWith(cu, 123, ['submission_delete', 'submission_create']);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'You do not have access to this submission.' }));
  });

  it('falls through to the query if the current user does not have the expected permission for FORM access on the current form (single check)', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: {
        id: '999',
        identityProviders: [{ code: 'idir' }, { code: 'bceid' }],
      },
    });
    service.checkSubmissionPermission = jest.fn().mockReturnValue(undefined);

    const mw = hasSubmissionPermissions('submission_delete');
    const nxt = jest.fn();
    const cu = {
      forms: [
        {
          formId: '456',
        },
        {
          formId: '999',
          permissions: ['submission_read'],
        },
      ],
    };
    const req = {
      currentUser: cu,
      params: {
        formSubmissionId: 123,
      },
    };

    await mw(req, testRes, nxt);
    // just run to the end and fall into the base case
    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(1);
    expect(service.checkSubmissionPermission).toHaveBeenCalledWith(cu, 123, ['submission_delete']);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'You do not have access to this submission.' }));
  });

  it('moves on if the user has the appropriate requested permissions', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: {
        id: '999',
        identityProviders: [{ code: 'idir' }, { code: 'bceid' }],
      },
    });
    service.checkSubmissionPermission = jest.fn().mockReturnValue(undefined);

    const mw = hasSubmissionPermissions(['submission_read', 'submission_update']);
    const nxt = jest.fn();
    const cu = {
      forms: [
        {
          formId: '456',
        },
        {
          formId: '999',
          permissions: ['submission_read', 'submission_update'],
        },
      ],
    };
    const req = {
      currentUser: cu,
      params: {
        formSubmissionId: 123,
      },
    };

    await mw(req, testRes, nxt);
    // just run to the end and fall into the base case
    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(0);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });

  it('moves on if the user has the appropriate requested permissions (single included in array)', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: {
        id: '999',
        identityProviders: [{ code: 'idir' }, { code: 'bceid' }],
      },
    });
    service.checkSubmissionPermission = jest.fn().mockReturnValue(undefined);

    const mw = hasSubmissionPermissions('submission_read');
    const nxt = jest.fn();
    const cu = {
      forms: [
        {
          formId: '456',
        },
        {
          formId: '999',
          permissions: ['submission_read', 'submission_update', 'submission_delete'],
        },
      ],
    };
    const req = {
      currentUser: cu,
      params: {
        formSubmissionId: 123,
      },
    };

    await mw(req, testRes, nxt);
    // just run to the end and fall into the base case
    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(0);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });
});

describe('hasFormRoles', () => {
  it('falls through if the current user does not have any forms', async () => {
    const hfr = hasFormRoles([Roles.OWNER, Roles.TEAM_MANAGER]);
    const nxt = jest.fn();
    const cu = {
      forms: [],
    };
    const req = {
      currentUser: cu,
      params: {},
      query: {
        formId: formId,
      },
    };

    await hfr(req, testRes, nxt);

    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'You do not have any forms.' }));
  });

  it('falls through if the current user does not have at least one of the required form roles', async () => {
    const hfr = hasFormRoles([Roles.OWNER, Roles.TEAM_MANAGER]);
    const nxt = jest.fn();
    const cu = {
      forms: [
        {
          id: formId,
          roles: [],
        },
      ],
    };
    const req = {
      currentUser: cu,
      params: {},
      query: {
        formId: formId,
      },
    };

    await hfr(req, testRes, nxt);

    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'You do not have permission to update this role.' }));
  });

  it('falls through if the current user does not have all of the required form roles', async () => {
    const hfr = hasFormRoles([Roles.OWNER, Roles.TEAM_MANAGER], true);
    const nxt = jest.fn();
    const cu = {
      forms: [
        {
          id: formId,
          roles: [Roles.TEAM_MANAGER],
        },
      ],
    };
    const req = {
      currentUser: cu,
      params: {},
      query: {
        formId: formId,
      },
    };

    await hfr(req, testRes, nxt);

    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'You do not have permission to update this role.' }));
  });

  it('moves on if the user has at least one of the required form roles', async () => {
    const hfr = hasFormRoles([Roles.OWNER, Roles.TEAM_MANAGER]);
    const nxt = jest.fn();
    const cu = {
      forms: [
        {
          formId: formId,
          roles: [Roles.TEAM_MANAGER],
        },
      ],
    };
    const req = {
      currentUser: cu,
      params: {},
      query: {
        formId: formId,
      },
    };

    await hfr(req, testRes, nxt);

    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });

  it('moves on if the user has all of the required form roles', async () => {
    const hfr = hasFormRoles([Roles.OWNER, Roles.TEAM_MANAGER], true);
    const nxt = jest.fn();
    const cu = {
      forms: [
        {
          formId: formId,
          roles: [Roles.OWNER, Roles.TEAM_MANAGER],
        },
      ],
    };
    const req = {
      currentUser: cu,
      params: {},
      query: {
        formId: formId,
      },
    };

    await hfr(req, testRes, nxt);

    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });
});

describe('hasRolePermissions', () => {
  describe('when removing users from a team', () => {
    describe('as an owner', () => {
      it('should succeed with valid data', async () => {
        rbacService.readUserRole = jest.fn().mockReturnValue([
          {
            userId: userId2,
            formId: formId,
            role: Roles.OWNER,
          },
        ]);
        const hrp = hasRolePermissions(true);
        const nxt = jest.fn();

        const cu = {
          id: userId,
          forms: [
            {
              formId: formId,
              roles: [Roles.OWNER, Roles.TEAM_MANAGER],
            },
          ],
        };
        const req = {
          currentUser: cu,
          params: {},
          query: {
            formId: formId,
          },
          body: [userId2],
        };

        await hrp(req, testRes, nxt);

        expect(nxt).toHaveBeenCalledTimes(1);
        expect(nxt).toHaveBeenCalledWith();
      });
    });

    describe('as a team manager', () => {
      it('should succeed with valid data', async () => {
        rbacService.readUserRole = jest.fn().mockReturnValue([
          {
            userId: userId2,
            formId: formId,
            role: Roles.FORM_SUBMITTER,
          },
        ]);

        const hrp = hasRolePermissions(true);

        const nxt = jest.fn();

        const cu = {
          id: userId,
          forms: [
            {
              formId: formId,
              roles: [Roles.TEAM_MANAGER],
            },
          ],
        };
        const req = {
          currentUser: cu,
          params: {},
          query: {
            formId: formId,
          },
          body: [userId2],
        };

        await hrp(req, testRes, nxt);

        expect(nxt).toHaveBeenCalledTimes(1);
        expect(nxt).toHaveBeenCalledWith();
      });

      it("falls through if you're trying to remove your own team manager role", async () => {
        rbacService.readUserRole = jest.fn().mockReturnValue([
          {
            userId: userId2,
            formId: formId,
            role: Roles.TEAM_MANAGER,
          },
        ]);

        const hrp = hasRolePermissions(true);

        const nxt = jest.fn();

        const cu = {
          id: userId,
          forms: [
            {
              formId: formId,
              roles: [Roles.TEAM_MANAGER],
            },
          ],
        };
        const req = {
          currentUser: cu,
          params: {},
          query: {
            formId: formId,
          },
          body: [userId2],
        };

        await hrp(req, testRes, nxt);

        expect(nxt).toHaveBeenCalledTimes(1);
        expect(nxt).toHaveBeenCalledWith();
      });

      it("falls through if you're trying to remove an owner role", async () => {
        rbacService.readUserRole = jest.fn().mockReturnValue([
          {
            userId: userId2,
            formId: formId,
            role: Roles.OWNER,
          },
        ]);

        const hrp = hasRolePermissions(true);

        const nxt = jest.fn();

        const cu = {
          id: userId,
          forms: [
            {
              formId: formId,
              roles: [Roles.TEAM_MANAGER],
            },
          ],
        };
        const req = {
          currentUser: cu,
          params: {},
          query: {
            formId: formId,
          },
          body: [userId2],
        };

        await hrp(req, testRes, nxt);

        expect(nxt).toHaveBeenCalledTimes(1);
        expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: "You can't update an owner's roles." }));
      });

      it("falls through if you're trying to remove a form designer role", async () => {
        rbacService.readUserRole = jest.fn().mockReturnValue([
          {
            userId: userId2,
            formId: formId,
            role: Roles.FORM_DESIGNER,
          },
        ]);

        const hrp = hasRolePermissions(true);

        const nxt = jest.fn();

        const cu = {
          id: userId,
          forms: [
            {
              formId: formId,
              roles: [Roles.TEAM_MANAGER],
            },
          ],
        };
        const req = {
          currentUser: cu,
          params: {},
          query: {
            formId: formId,
          },
          body: [userId2],
        };

        await hrp(req, testRes, nxt);

        expect(nxt).toHaveBeenCalledTimes(1);
        expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: "You can't remove a form designer role." }));
      });
    });
  });

  describe('when updating user roles on a team', () => {
    describe('as an owner', () => {
      it('should succeed when removing any roles', async () => {
        rbacService.readUserRole = jest.fn().mockReturnValue([
          {
            id: '1',
            role: Roles.OWNER,
            formId: formId,
            userId: userId2,
            createdBy: '',
            createdAt: '',
            updatedBy: '',
            updatedAt: '',
          },
          {
            id: '2',
            role: Roles.TEAM_MANAGER,
            formId: formId,
            userId: userId2,
            createdBy: '',
            createdAt: '',
            updatedBy: '',
            updatedAt: '',
          },
          {
            id: '3',
            role: Roles.SUBMISSION_REVIEWER,
            formId: formId,
            userId: userId2,
            createdBy: '',
            createdAt: '',
            updatedBy: '',
            updatedAt: '',
          },
          {
            id: '4',
            role: Roles.FORM_DESIGNER,
            formId: formId,
            userId: userId2,
            createdBy: '',
            createdAt: '',
            updatedBy: '',
            updatedAt: '',
          },
          {
            id: '5',
            role: Roles.FORM_SUBMITTER,
            formId: formId,
            userId: userId2,
            createdBy: '',
            createdAt: '',
            updatedBy: '',
            updatedAt: '',
          },
        ]);

        const hrp = hasRolePermissions(false);

        const nxt = jest.fn();

        const cu = {
          id: userId,
          forms: [
            {
              formId: formId,
              roles: [Roles.OWNER],
            },
          ],
        };
        const req = {
          currentUser: cu,
          params: {
            userId: userId2,
            formId: formId,
          },
          query: {
            formId: formId,
          },
          body: [],
        };

        await hrp(req, testRes, nxt);

        expect(nxt).toHaveBeenCalledTimes(1);
        expect(nxt).toHaveBeenCalledWith();
      });
    });

    describe('as a team manager', () => {
      describe('the user being updated is your own', () => {
        it("falls through if you're trying to remove your own team manager role", async () => {
          rbacService.readUserRole = jest.fn().mockReturnValue([
            {
              id: '1',
              role: Roles.TEAM_MANAGER,
              formId: formId,
              userId: userId,
              createdBy: '',
              createdAt: '',
              updatedBy: '',
              updatedAt: '',
            },
            {
              id: '2',
              role: Roles.FORM_DESIGNER,
              formId: formId,
              userId: userId,
              createdBy: '',
              createdAt: '',
              updatedBy: '',
              updatedAt: '',
            },
          ]);

          const hrp = hasRolePermissions(false);

          const nxt = jest.fn();

          const cu = {
            id: userId,
            forms: [
              {
                formId: formId,
                roles: [Roles.TEAM_MANAGER, Roles.FORM_DESIGNER],
              },
            ],
          };
          const req = {
            currentUser: cu,
            params: {
              userId: cu.id,
            },
            query: {
              formId: formId,
            },
            body: [
              {
                userId: cu.id,
                formId: formId,
                role: Roles.FORM_DESIGNER,
              },
            ],
          };

          await hrp(req, testRes, nxt);

          expect(nxt).toHaveBeenCalledTimes(1);
          expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: "You can't remove your own team manager role." }));
        });
      });

      describe('the user being updated is not your own', () => {
        describe('is an owner', () => {
          it('falls through if trying to make any role changes', async () => {
            rbacService.readUserRole = jest.fn().mockReturnValue([
              {
                id: '1',
                role: Roles.OWNER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '2',
                role: Roles.FORM_DESIGNER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '3',
                role: Roles.SUBMISSION_REVIEWER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
            ]);

            const hrp = hasRolePermissions(false);

            const nxt = jest.fn();

            const cu = {
              id: userId,
              forms: [
                {
                  formId: formId,
                  roles: [Roles.TEAM_MANAGER],
                },
              ],
            };
            const req = {
              currentUser: cu,
              params: {
                userId: userId2,
              },
              query: {
                formId: formId,
              },
              body: [
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.SUBMISSION_REVIEWER,
                },
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.FORM_SUBMITTER,
                },
              ],
            };

            await hrp(req, testRes, nxt);

            expect(nxt).toHaveBeenCalledTimes(1);
            expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: "You can't update an owner's roles." }));
          });
        });

        describe('is not an owner', () => {
          it('falls through if trying to add an owner role', async () => {
            rbacService.readUserRole = jest.fn().mockReturnValue([
              {
                id: '1',
                role: Roles.FORM_SUBMITTER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '3',
                role: Roles.SUBMISSION_REVIEWER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
            ]);

            const hrp = hasRolePermissions(false);

            const nxt = jest.fn();

            const cu = {
              id: userId,
              forms: [
                {
                  formId: formId,
                  roles: [Roles.TEAM_MANAGER],
                },
              ],
            };
            const req = {
              currentUser: cu,
              params: {
                userId: userId2,
              },
              query: {
                formId: formId,
              },
              body: [
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.OWNER,
                },
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.FORM_SUBMITTER,
                },
              ],
            };

            await hrp(req, testRes, nxt);

            expect(nxt).toHaveBeenCalledTimes(1);
            expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: "You can't add an owner role." }));
          });

          it('falls through if trying to remove an owner role', async () => {
            rbacService.readUserRole = jest.fn().mockReturnValue([
              {
                id: '1',
                role: Roles.OWNER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '2',
                role: Roles.FORM_DESIGNER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '3',
                role: Roles.SUBMISSION_REVIEWER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
            ]);

            const hrp = hasRolePermissions(false);

            const nxt = jest.fn();

            const cu = {
              id: userId,
              forms: [
                {
                  formId: formId,
                  roles: [Roles.TEAM_MANAGER],
                },
              ],
            };
            const req = {
              currentUser: cu,
              params: {
                userId: userId2,
              },
              query: {
                formId: formId,
              },
              body: [
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.SUBMISSION_REVIEWER,
                },
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.FORM_SUBMITTER,
                },
              ],
            };

            await hrp(req, testRes, nxt);

            expect(nxt).toHaveBeenCalledTimes(1);
            expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: "You can't update an owner's roles." }));
          });

          it('falls through if trying to add a designer role', async () => {
            rbacService.readUserRole = jest.fn().mockReturnValue([
              {
                id: '1',
                role: Roles.FORM_SUBMITTER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '3',
                role: Roles.SUBMISSION_REVIEWER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
            ]);

            const hrp = hasRolePermissions(false);

            const nxt = jest.fn();

            const cu = {
              id: userId,
              forms: [
                {
                  formId: formId,
                  roles: [Roles.TEAM_MANAGER],
                },
              ],
            };
            const req = {
              currentUser: cu,
              params: {
                userId: userId2,
              },
              query: {
                formId: formId,
              },
              body: [
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.FORM_DESIGNER,
                },
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.FORM_SUBMITTER,
                },
              ],
            };

            await hrp(req, testRes, nxt);

            expect(nxt).toHaveBeenCalledTimes(1);
            expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: "You can't add a form designer role." }));
          });

          it('falls through if trying to remove a designer role', async () => {
            rbacService.readUserRole = jest.fn().mockReturnValue([
              {
                id: '1',
                role: Roles.FORM_SUBMITTER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '2',
                role: Roles.FORM_DESIGNER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '3',
                role: Roles.SUBMISSION_REVIEWER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
            ]);

            const hrp = hasRolePermissions(false);

            const nxt = jest.fn();

            const cu = {
              id: userId,
              forms: [
                {
                  formId: formId,
                  roles: [Roles.TEAM_MANAGER],
                },
              ],
            };
            const req = {
              currentUser: cu,
              params: {
                userId: userId2,
              },
              query: {
                formId: formId,
              },
              body: [
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.SUBMISSION_REVIEWER,
                },
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.FORM_SUBMITTER,
                },
              ],
            };

            await hrp(req, testRes, nxt);

            expect(nxt).toHaveBeenCalledTimes(1);
            expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: "You can't remove a form designer role." }));
          });

          it('should succeed when adding a manager/reviewer/submitter roles', async () => {
            rbacService.readUserRole = jest.fn().mockReturnValue([]);

            const hrp = hasRolePermissions(false);

            const nxt = jest.fn();

            const cu = {
              id: userId,
              forms: [
                {
                  formId: formId,
                  roles: [Roles.TEAM_MANAGER],
                },
              ],
            };
            const req = {
              currentUser: cu,
              params: {
                userId: userId2,
              },
              query: {
                formId: formId,
              },
              body: [
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.TEAM_MANAGER,
                },
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.SUBMISSION_REVIEWER,
                },
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.FORM_SUBMITTER,
                },
              ],
            };

            await hrp(req, testRes, nxt);

            expect(nxt).toHaveBeenCalledTimes(1);
            expect(nxt).toHaveBeenCalledWith();
          });

          it('should succeed when removing a manager roles', async () => {
            rbacService.readUserRole = jest.fn().mockReturnValue([
              {
                id: '1',
                role: Roles.FORM_SUBMITTER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '2',
                role: Roles.TEAM_MANAGER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '3',
                role: Roles.SUBMISSION_REVIEWER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
            ]);

            const hrp = hasRolePermissions(false);

            const nxt = jest.fn();

            const cu = {
              id: userId,
              forms: [
                {
                  formId: formId,
                  roles: [Roles.TEAM_MANAGER],
                },
              ],
            };
            const req = {
              currentUser: cu,
              params: {
                userId: userId2,
                formId: formId,
              },
              query: {
                formId: formId,
              },
              body: [
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.SUBMISSION_REVIEWER,
                },
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.FORM_SUBMITTER,
                },
              ],
            };

            await hrp(req, testRes, nxt);

            expect(nxt).toHaveBeenCalledTimes(1);
            expect(nxt).toHaveBeenCalledWith();
          });

          it('should succeed when removing a reviewer roles', async () => {
            rbacService.readUserRole = jest.fn().mockReturnValue([
              {
                id: '1',
                role: Roles.FORM_SUBMITTER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '2',
                role: Roles.TEAM_MANAGER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '3',
                role: Roles.SUBMISSION_REVIEWER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
            ]);

            const hrp = hasRolePermissions(false);

            const nxt = jest.fn();

            const cu = {
              id: userId,
              forms: [
                {
                  formId: formId,
                  roles: [Roles.TEAM_MANAGER],
                },
              ],
            };
            const req = {
              currentUser: cu,
              params: {
                userId: userId2,
                formId: formId,
              },
              query: {
                formId: formId,
              },
              body: [
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.TEAM_MANAGER,
                },
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.FORM_SUBMITTER,
                },
              ],
            };

            await hrp(req, testRes, nxt);

            expect(nxt).toHaveBeenCalledTimes(1);
            expect(nxt).toHaveBeenCalledWith();
          });

          it('should succeed when removing a submitter roles', async () => {
            rbacService.readUserRole = jest.fn().mockReturnValue([
              {
                id: '1',
                role: Roles.FORM_SUBMITTER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '2',
                role: Roles.TEAM_MANAGER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '3',
                role: Roles.SUBMISSION_REVIEWER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
            ]);

            const hrp = hasRolePermissions(false);

            const nxt = jest.fn();

            const cu = {
              id: userId,
              forms: [
                {
                  formId: formId,
                  roles: [Roles.TEAM_MANAGER],
                },
              ],
            };
            const req = {
              currentUser: cu,
              params: {
                userId: userId2,
                formId: formId,
              },
              query: {
                formId: formId,
              },
              body: [
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.TEAM_MANAGER,
                },
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.SUBMISSION_REVIEWER,
                },
              ],
            };

            await hrp(req, testRes, nxt);

            expect(nxt).toHaveBeenCalledTimes(1);
            expect(nxt).toHaveBeenCalledWith();
          });

          it('should succeed when removing a manager/reviewer/submitter roles', async () => {
            rbacService.readUserRole = jest.fn().mockReturnValue([
              {
                id: '1',
                role: Roles.FORM_SUBMITTER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '2',
                role: Roles.TEAM_MANAGER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '3',
                role: Roles.SUBMISSION_REVIEWER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
            ]);

            const hrp = hasRolePermissions(false);

            const nxt = jest.fn();

            const cu = {
              id: userId,
              forms: [
                {
                  formId: formId,
                  roles: [Roles.TEAM_MANAGER],
                },
              ],
            };
            const req = {
              currentUser: cu,
              params: {
                userId: userId2,
                formId: formId,
              },
              query: {
                formId: formId,
              },
              body: [],
            };

            await hrp(req, testRes, nxt);

            expect(nxt).toHaveBeenCalledTimes(1);
            expect(nxt).toHaveBeenCalledWith();
          });
        });
      });
    });
  });
});
