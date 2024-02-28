const { getMockReq, getMockRes } = require('@jest-mock/express');
const Problem = require('api-problem');
const uuid = require('uuid');

const { currentUser, hasFormPermissions, hasSubmissionPermissions, hasFormRoles, hasRolePermissions } = require('../../../../../src/forms/auth/middleware/userAccess');

const jwtService = require('../../../../../src/components/jwtService');
const service = require('../../../../../src/forms/auth/service');
const rbacService = require('../../../../../src/forms/rbac/service');

const formId = uuid.v4();
const formSubmissionId = uuid.v4();
const userId = 'c6455376-382c-439d-a811-0381a012d695';
const userId2 = 'c6455376-382c-439d-a811-0381a012d696';

const Roles = {
  OWNER: 'owner',
  TEAM_MANAGER: 'team_manager',
  FORM_DESIGNER: 'form_designer',
  SUBMISSION_REVIEWER: 'submission_reviewer',
  FORM_SUBMITTER: 'form_submitter',
};

jwtService.validateAccessToken = jest.fn().mockReturnValue(true);
jwtService.getBearerToken = jest.fn().mockReturnValue('bearer-token-value');
jwtService.getTokenPayload = jest.fn().mockReturnValue({ token: 'payload' });

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

// External dependencies used by the implementation are:
//  - jwtService.validateAccessToken: to validate a Bearer token
//  - service.login: to create the object for req.currentUser
//
describe('currentUser', () => {
  it('gets the current user with valid request', async () => {
    const testReq = {
      params: {
        formId: 2,
      },
      headers: {
        authorization: 'Bearer hjvds0uds',
      },
    };

    const nxt = jest.fn();

    await currentUser(testReq, testRes, nxt);
    expect(jwtService.validateAccessToken).toHaveBeenCalledTimes(1);
    expect(jwtService.getBearerToken).toHaveBeenCalledTimes(1);
    expect(jwtService.validateAccessToken).toHaveBeenCalledWith('bearer-token-value');
    expect(service.login).toHaveBeenCalledTimes(1);
    expect(service.login).toHaveBeenCalledWith({ token: 'payload' });
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
    };

    await currentUser(testReq, testRes, jest.fn());
    expect(jwtService.getBearerToken).toHaveBeenCalledTimes(1);
    expect(jwtService.getTokenPayload).toHaveBeenCalledTimes(1);
    expect(service.login).toHaveBeenCalledWith({ token: 'payload' });
  });

  it('uses the query param if both if that is whats provided', async () => {
    const testReq = {
      query: {
        formId: 99,
      },
      headers: {
        authorization: 'Bearer hjvds0uds',
      },
    };

    await currentUser(testReq, testRes, jest.fn());
    expect(jwtService.getBearerToken).toHaveBeenCalledTimes(1);
    expect(jwtService.getTokenPayload).toHaveBeenCalledTimes(1);
    expect(service.login).toHaveBeenCalledWith({ token: 'payload' });
  });

  it('403s if the token is invalid', async () => {
    const testReq = {
      headers: {
        authorization: 'Bearer hjvds0uds',
      },
    };

    const nxt = jest.fn();
    jwtService.validateAccessToken = jest.fn().mockReturnValue(false);

    await currentUser(testReq, testRes, nxt);
    expect(jwtService.getBearerToken).toHaveBeenCalledTimes(1);
    expect(jwtService.validateAccessToken).toHaveBeenCalledTimes(1);
    expect(jwtService.validateAccessToken).toHaveBeenCalledWith('bearer-token-value');
    expect(service.login).toHaveBeenCalledTimes(0);
    expect(testReq.currentUser).toEqual(undefined);
    expect(nxt).toHaveBeenCalledTimes(0);
    //expect(nxt).toHaveBeenCalledWith(new Problem(403, { detail: 'Authorization token is invalid.' }));
  });
});

describe('getToken', () => {
  it('returns a null token if no auth bearer in the headers', async () => {
    const testReq = {
      params: {
        formId: 2,
      },
    };

    jwtService.getBearerToken = jest.fn().mockReturnValue(null);
    jwtService.getTokenPayload = jest.fn().mockReturnValue(null);

    await currentUser(testReq, testRes, jest.fn());
    expect(jwtService.getBearerToken).toHaveBeenCalledTimes(1);
    expect(jwtService.getTokenPayload).toHaveBeenCalledTimes(1);
    expect(service.login).toHaveBeenCalledTimes(1);
    expect(service.login).toHaveBeenCalledWith(null);
  });
});

// External dependencies used by the implementation are:
//  - service.getUserForms: gets the forms that the user can access
//
describe('hasFormPermissions', () => {
  // Default mock value where the user has no access to forms
  service.getUserForms = jest.fn().mockReturnValue([]);

  it('returns a middleware function', async () => {
    const middleware = hasFormPermissions(['FORM_READ']);

    expect(middleware).toBeInstanceOf(Function);
  });

  it('400s if the request has no formId', async () => {
    const req = getMockReq({
      currentUser: {},
      params: {
        submissionId: formSubmissionId,
      },
      query: {
        otherQueryThing: 'SOMETHING',
      },
    });
    const { res, next } = getMockRes();

    await hasFormPermissions(['FORM_READ'])(req, res, next);

    expect(service.getUserForms).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  it('400s if the formId is not a uuid', async () => {
    const req = getMockReq({
      currentUser: {},
      params: {
        formId: 'undefined',
      },
      query: {
        otherQueryThing: 'SOMETHING',
      },
    });
    const { res, next } = getMockRes();

    await hasFormPermissions(['FORM_READ'])(req, res, next);

    expect(service.getUserForms).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  // TODO: This should be a 403, but bundle all breaking changes in a small PR.
  it('401s if the user does not have access to the form', async () => {
    const req = getMockReq({
      currentUser: {},
      params: {
        formId: formId,
      },
    });
    const { res, next } = getMockRes();

    await hasFormPermissions(['FORM_READ'])(req, res, next);

    expect(service.getUserForms).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  // TODO: This should be a 403, but bundle all breaking changes in a small PR.
  it('401s if the expected permissions are not included', async () => {
    service.getUserForms.mockReturnValueOnce([
      {
        formId: formId,
        permissions: ['DESIGN_CREATE', 'FORM_READ', 'SUBMISSION_READ'],
      },
    ]);
    const req = getMockReq({
      currentUser: {},
      params: {
        formId: formId,
      },
    });
    const { res, next } = getMockRes();

    await hasFormPermissions(['DESIGN_CREATE', 'FORM_READ', 'SUBMISSION_DELETE'])(req, res, next);

    expect(service.getUserForms).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  // TODO: This should be a 403, but bundle all breaking changes in a small PR.
  it('401s if the permissions are a subset but not including everything', async () => {
    service.getUserForms.mockReturnValueOnce([
      {
        formId: formId,
        permissions: ['DESIGN_CREATE', 'FORM_READ'],
      },
    ]);
    const req = getMockReq({
      currentUser: {},
      params: {
        formId: formId,
      },
    });
    const { res, next } = getMockRes();

    await hasFormPermissions(['DESIGN_CREATE', 'FORM_READ', 'SUBMISSION_DELETE'])(req, res, next);

    expect(service.getUserForms).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('500s if the request has no current user', async () => {
    const req = getMockReq({
      params: { formId: formId },
    });
    const { res, next } = getMockRes();

    await hasFormPermissions(['FORM_READ'])(req, res, next);

    expect(service.getUserForms).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 500 }));
  });

  it('moves on if a valid API key user has already been set', async () => {
    const req = getMockReq({
      apiUser: true,
      params: { formId: formId },
    });
    const { res, next } = getMockRes();

    await hasFormPermissions(['FORM_READ'])(req, res, next);

    expect(service.getUserForms).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('moves on if the expected permissions are included', async () => {
    service.getUserForms.mockReturnValueOnce([
      {
        formId: formId,
        permissions: ['DESIGN_CREATE', 'FORM_READ', 'SUBMISSION_DELETE'],
      },
    ]);
    const req = getMockReq({
      currentUser: {},
      params: {
        formId: formId,
      },
    });
    const { res, next } = getMockRes();

    await hasFormPermissions(['DESIGN_CREATE', 'FORM_READ', 'SUBMISSION_DELETE'])(req, res, next);

    expect(service.getUserForms).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('moves on if the expected permissions are included with query formId', async () => {
    service.getUserForms.mockReturnValueOnce([
      {
        formId: formId,
        permissions: ['DESIGN_CREATE', 'FORM_READ', 'SUBMISSION_DELETE'],
      },
    ]);
    const req = getMockReq({
      currentUser: {},
      query: {
        formId: formId,
      },
    });
    const { res, next } = getMockRes();

    await hasFormPermissions(['DESIGN_CREATE', 'FORM_READ', 'SUBMISSION_DELETE'])(req, res, next);

    expect(service.getUserForms).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('moves on if the user has deleted form access', async () => {
    service.getUserForms.mockReturnValueOnce([]).mockReturnValueOnce([
      {
        formId: formId,
        permissions: ['FORM_READ'],
      },
    ]);
    const req = getMockReq({
      currentUser: {},
      params: {
        formId: formId,
      },
    });
    const { res, next } = getMockRes();

    await hasFormPermissions(['FORM_READ'])(req, res, next);

    expect(service.getUserForms).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
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
    const cu = {};
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

  it('falls through to the query if the current user has no forms', async () => {
    service.checkSubmissionPermission = jest.fn().mockReturnValue(undefined);
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { id: 456, deleted: false },
      form: { identityProviders: [{ code: 'idir' }, { code: 'bceid' }] },
    });
    service.getUserForms = jest.fn().mockReturnValue([]);

    const nxt = jest.fn();
    const req = {
      currentUser: {},
      params: {
        formSubmissionId: 123,
      },
    };

    const mw = hasSubmissionPermissions('submission_read');
    await mw(req, testRes, nxt);

    // just run to the end and fall into the base case
    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(1);
    expect(service.checkSubmissionPermission).toHaveBeenCalledWith(req.currentUser, 123, ['submission_read']);
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
    const cu = {};
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
    const cu = {};
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
    const cu = {};
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
    service.getUserForms = jest.fn().mockReturnValue([
      {
        formId: '456',
      },
      {
        formId: '999',
        permissions: ['submission_read', 'submission_update'],
      },
    ]);
    service.checkSubmissionPermission = jest.fn().mockReturnValue(undefined);

    const mw = hasSubmissionPermissions(['submission_read', 'submission_update']);
    const nxt = jest.fn();
    const req = {
      currentUser: {},
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
    const cu = {};
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
    const cu = {};
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
    const cu = {};
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
    const cu = {};
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
    service.getUserForms = jest.fn().mockReturnValue([
      {
        formId: formId,
        roles: [Roles.TEAM_MANAGER],
      },
    ]);
    const hfr = hasFormRoles([Roles.OWNER, Roles.TEAM_MANAGER]);
    const nxt = jest.fn();
    const cu = {};
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
    service.getUserForms = jest.fn().mockReturnValue([
      {
        formId: formId,
        roles: [Roles.OWNER, Roles.TEAM_MANAGER],
      },
    ]);
    const hfr = hasFormRoles([Roles.OWNER, Roles.TEAM_MANAGER], true);
    const nxt = jest.fn();
    const cu = {};
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
        service.getUserForms = jest.fn().mockReturnValue([
          {
            formId: formId,
            roles: [Roles.TEAM_MANAGER],
          },
        ]);
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
        service.getUserForms = jest.fn().mockReturnValue([
          {
            formId: formId,
            roles: [Roles.OWNER],
          },
        ]);
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
          service.getUserForms = jest.fn().mockReturnValue([
            {
              formId: formId,
              roles: [Roles.TEAM_MANAGER, Roles.FORM_DESIGNER],
            },
          ]);
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
