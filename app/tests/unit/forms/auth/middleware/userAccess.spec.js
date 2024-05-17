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

const bearerToken = Math.random().toString(36).substring(2);

const Roles = {
  OWNER: 'owner',
  TEAM_MANAGER: 'team_manager',
  FORM_DESIGNER: 'form_designer',
  SUBMISSION_APPROVER: 'submission_approver',
  SUBMISSION_REVIEWER: 'submission_reviewer',
  FORM_SUBMITTER: 'form_submitter',
};

jwtService.validateAccessToken = jest.fn().mockReturnValue(true);
jwtService.getBearerToken = jest.fn().mockReturnValue(bearerToken);
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
        authorization: 'Bearer ' + bearerToken,
      },
    };

    const nxt = jest.fn();

    await currentUser(testReq, testRes, nxt);
    expect(jwtService.validateAccessToken).toHaveBeenCalledTimes(1);
    expect(jwtService.getBearerToken).toHaveBeenCalledTimes(1);
    expect(jwtService.validateAccessToken).toHaveBeenCalledWith(bearerToken);
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
        authorization: 'Bearer ' + bearerToken,
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
        authorization: 'Bearer ' + bearerToken,
      },
    };

    await currentUser(testReq, testRes, jest.fn());
    expect(jwtService.getBearerToken).toHaveBeenCalledTimes(1);
    expect(jwtService.getTokenPayload).toHaveBeenCalledTimes(1);
    expect(service.login).toHaveBeenCalledWith({ token: 'payload' });
  });

  it('401s if the token is invalid', async () => {
    const testReq = {
      headers: {
        authorization: 'Bearer ' + bearerToken,
      },
    };

    const nxt = jest.fn();
    jwtService.validateAccessToken = jest.fn().mockReturnValue(false);

    await currentUser(testReq, testRes, nxt);
    expect(jwtService.getBearerToken).toHaveBeenCalledTimes(1);
    expect(jwtService.validateAccessToken).toHaveBeenCalledTimes(1);
    expect(jwtService.validateAccessToken).toHaveBeenCalledWith(bearerToken);
    expect(service.login).toHaveBeenCalledTimes(0);
    expect(testReq.currentUser).toEqual(undefined);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'Authorization token is invalid.' }));
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

// External dependencies used by the implementation are:
//  - service.checkSubmissionPermission: gets whether the user has permission
//  - service.getSubmissionForm: gets the submission that the user can access
//  - service.getUserForms: gets the forms that the user can access
//
describe('hasSubmissionPermissions', () => {
  // Default mock value where the user has no access to submission
  service.checkSubmissionPermission = jest.fn().mockReturnValue(false);

  // Default mock value where there is no submission
  service.getSubmissionForm = jest.fn().mockReturnValue();

  // Default mock value where the user has no access to forms
  service.getUserForms = jest.fn().mockReturnValue([]);

  it('returns a middleware function', () => {
    const middleware = hasSubmissionPermissions(['submission_read']);

    expect(middleware).toBeInstanceOf(Function);
  });

  it('400s if the request has no formSubmissionId', async () => {
    const req = getMockReq();
    const { res, next } = getMockRes();

    await hasSubmissionPermissions(['submission_read'])(req, res, next);

    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(0);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(0);
    expect(service.getUserForms).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  it('400s if the formSubmissionId is not a uuid', async () => {
    const req = getMockReq({
      currentUser: {},
      params: {
        formSubmissionId: 'not-a-uuid',
      },
    });
    const { res, next } = getMockRes();

    await hasSubmissionPermissions(['submission_read'])(req, res, next);

    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(0);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(0);
    expect(service.getUserForms).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  it('401s for deleted submission when no current user', async () => {
    service.getSubmissionForm.mockReturnValueOnce({
      form: { id: formId },
      submission: { deleted: true, id: formSubmissionId },
    });
    const req = getMockReq({
      params: {
        formSubmissionId: formSubmissionId,
      },
    });
    const { res, next } = getMockRes();

    await hasSubmissionPermissions(['submission_read'])(req, res, next);

    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(0);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(1);
    expect(service.getUserForms).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('401s for deleted submission', async () => {
    service.getSubmissionForm.mockReturnValueOnce({
      form: { id: formId },
      submission: { deleted: true, id: formSubmissionId },
    });
    const req = getMockReq({
      currentUser: {},
      params: {
        formSubmissionId: formSubmissionId,
      },
    });
    const { res, next } = getMockRes();

    await hasSubmissionPermissions(['submission_read'])(req, res, next);

    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(0);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(1);
    expect(service.getUserForms).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('401s for deleted submission if user has no forms', async () => {
    service.getSubmissionForm.mockReturnValueOnce({
      form: { id: formId },
      submission: { deleted: true, id: formSubmissionId },
    });
    const req = getMockReq({
      currentUser: {},
      params: {
        formSubmissionId: formSubmissionId,
      },
    });
    const { res, next } = getMockRes();

    await hasSubmissionPermissions(['submission_read'])(req, res, next);

    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(0);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(1);
    expect(service.getUserForms).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('401s for deleted submission if user has no form access', async () => {
    service.getSubmissionForm.mockReturnValueOnce({
      form: { id: formId },
      submission: { deleted: true, id: formSubmissionId },
    });
    service.getUserForms.mockReturnValueOnce([
      {
        formId: formId,
        permissions: [],
      },
    ]);
    const req = getMockReq({
      currentUser: {},
      params: {
        formSubmissionId: formSubmissionId,
      },
    });
    const { res, next } = getMockRes();

    await hasSubmissionPermissions(['submission_read'])(req, res, next);

    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(0);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(1);
    expect(service.getUserForms).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('401s for deleted submission if user only has some form access', async () => {
    service.getSubmissionForm.mockReturnValueOnce({
      form: { id: formId },
      submission: { deleted: true, id: formSubmissionId },
    });
    service.getUserForms.mockReturnValueOnce([
      {
        formId: formId,
        permissions: ['submission_read'],
      },
    ]);
    const req = getMockReq({
      currentUser: {},
      params: {
        formSubmissionId: formSubmissionId,
      },
    });
    const { res, next } = getMockRes();

    await hasSubmissionPermissions(['submission_read', 'submission_update'])(req, res, next);

    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(0);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(1);
    expect(service.getUserForms).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('401s on submission permissions if public access and not read permission', async () => {
    service.checkSubmissionPermission.mockReturnValueOnce(undefined);
    service.getSubmissionForm.mockReturnValueOnce({
      form: { id: formId, identityProviders: [{ code: 'public' }] },
      submission: { deleted: false, id: formSubmissionId },
    });
    const req = getMockReq({
      currentUser: {},
      params: {
        formSubmissionId: formSubmissionId,
      },
    });
    const { res, next } = getMockRes();

    await hasSubmissionPermissions(['submission_delete'])(req, res, next);

    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(1);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(1);
    expect(service.getUserForms).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('401s on submission permissions if public access and more than read permission', async () => {
    service.getSubmissionForm.mockReturnValueOnce({
      form: { id: formId, identityProviders: [{ code: 'public' }] },
      submission: { deleted: false, id: formSubmissionId },
    });
    const req = getMockReq({
      currentUser: {},
      params: {
        formSubmissionId: formSubmissionId,
      },
    });
    const { res, next } = getMockRes();

    await hasSubmissionPermissions(['submission_read', 'submission_delete'])(req, res, next);

    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(1);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(1);
    expect(service.getUserForms).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('401 on submission permissions if form does not have the public idp', async () => {
    service.getSubmissionForm.mockReturnValueOnce({
      form: {
        id: formId,
        identityProviders: [{ code: 'idir' }, { code: 'bceid' }],
      },
      submission: { deleted: false, id: formSubmissionId },
    });
    const req = getMockReq({
      currentUser: {},
      params: {
        formSubmissionId: formSubmissionId,
      },
    });
    const { res, next } = getMockRes();

    await hasSubmissionPermissions(['submission_read'])(req, res, next);

    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(1);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(1);
    expect(service.getUserForms).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('goes to error handler when getSubmissionForm errors', async () => {
    const error = new Error();
    service.getSubmissionForm.mockRejectedValueOnce(error);
    const req = getMockReq({
      currentUser: {},
      params: {
        formSubmissionId: formSubmissionId,
      },
    });
    const { res, next } = getMockRes();

    await hasSubmissionPermissions(['submission_read'])(req, res, next);

    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(0);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(1);
    expect(service.getUserForms).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('goes to error handler when getUserForms errors', async () => {
    service.getSubmissionForm.mockReturnValueOnce({
      form: { id: formId },
      submission: { submissionId: formSubmissionId },
    });
    const error = new Error();
    service.getUserForms.mockRejectedValueOnce(error);
    const req = getMockReq({
      currentUser: {},
      params: {
        formSubmissionId: formSubmissionId,
      },
    });
    const { res, next } = getMockRes();

    await hasSubmissionPermissions(['submission_read'])(req, res, next);

    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(0);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(1);
    expect(service.getUserForms).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('moves on if a valid API key user has already been set', async () => {
    const req = getMockReq({
      apiUser: true,
      params: {
        formSubmissionId: formSubmissionId,
      },
    });
    const { res, next } = getMockRes();

    await hasSubmissionPermissions(['submission_read'])(req, res, next);

    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(0);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(0);
    expect(service.getUserForms).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('moves on if the user has the exact form permissions', async () => {
    service.getSubmissionForm.mockReturnValueOnce({
      form: { id: formId },
      submission: { deleted: false, id: formSubmissionId },
    });
    service.getUserForms.mockReturnValueOnce([
      {
        // Ignore this form but match formId on the next one.
        formId: uuid.v4(),
      },
      {
        formId: formId,
        permissions: ['submission_read', 'submission_update'],
      },
    ]);
    const req = getMockReq({
      currentUser: {},
      params: {
        formSubmissionId: formSubmissionId,
      },
    });
    const { res, next } = getMockRes();

    await hasSubmissionPermissions(['submission_read', 'submission_update'])(req, res, next);

    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(0);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(1);
    expect(service.getUserForms).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('moves on if the user has extra form permissions', async () => {
    service.getSubmissionForm.mockReturnValueOnce({
      form: { id: formId },
      submission: { deleted: false, id: formSubmissionId },
    });
    service.getUserForms.mockReturnValueOnce([
      {
        // Ignore this form but match formId on the next one.
        formId: uuid.v4(),
      },
      {
        formId: formId,
        permissions: ['submission_read', 'submission_update'],
      },
    ]);
    const req = getMockReq({
      currentUser: {},
      params: {
        formSubmissionId: formSubmissionId,
      },
    });
    const { res, next } = getMockRes();

    await hasSubmissionPermissions(['submission_update'])(req, res, next);

    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(0);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(1);
    expect(service.getUserForms).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('moves on for public form and read permission', async () => {
    service.getSubmissionForm.mockReturnValueOnce({
      form: { id: formId, identityProviders: [{ code: 'public' }] },
      submission: { deleted: false, id: formSubmissionId },
    });
    service.getUserForms.mockReturnValueOnce([
      {
        formId: formId,
        permissions: [],
      },
    ]);
    const req = getMockReq({
      currentUser: {},
      params: {
        formSubmissionId: formSubmissionId,
      },
    });
    const { res, next } = getMockRes();

    await hasSubmissionPermissions(['submission_read'])(req, res, next);

    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(0);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(1);
    expect(service.getUserForms).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('moves on for public form and read permission with extra idp', async () => {
    service.getSubmissionForm.mockReturnValueOnce({
      form: {
        id: formId,
        identityProviders: [{ code: 'random' }, { code: 'public' }],
      },
      submission: { deleted: false, id: formSubmissionId },
    });
    service.getUserForms.mockReturnValueOnce([
      {
        formId: formId,
        permissions: [],
      },
    ]);
    const req = getMockReq({
      currentUser: {},
      params: {
        formSubmissionId: formSubmissionId,
      },
    });
    const { res, next } = getMockRes();

    await hasSubmissionPermissions(['submission_read'])(req, res, next);

    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(0);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(1);
    expect(service.getUserForms).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('moves on if the permission check succeeds', async () => {
    service.checkSubmissionPermission.mockReturnValueOnce(true);
    service.getSubmissionForm.mockReturnValueOnce({
      form: {
        id: formId,
        identityProviders: [{ code: 'idir' }, { code: 'bceid' }],
      },
      submission: { deleted: false, id: formSubmissionId },
    });
    const req = getMockReq({
      currentUser: {},
      params: {
        formSubmissionId: formSubmissionId,
      },
    });
    const { res, next } = getMockRes();

    await hasSubmissionPermissions(['submission_read'])(req, res, next);

    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(1);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(1);
    expect(service.getUserForms).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });
});

// External dependencies used by the implementation are:
//  - service.getUserForms: gets the forms that the user can access
//
describe('hasFormRoles', () => {
  // Default mock value where the user has no access to forms
  service.getUserForms = jest.fn().mockReturnValue([]);

  it('returns a middleware function', async () => {
    const middleware = hasFormRoles([Roles.OWNER]);

    expect(middleware).toBeInstanceOf(Function);
  });

  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    test('formId missing', async () => {
      const req = getMockReq({
        params: {
          submissionId: formSubmissionId,
        },
        query: {
          otherQueryThing: 'SOMETHING',
        },
      });
      const { res, next } = getMockRes();

      await hasFormRoles([Roles.OWNER])(req, res, next);

      expect(service.getUserForms).toHaveBeenCalledTimes(0);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.objectContaining(expectedStatus));
    });

    test('formId not a uuid', async () => {
      const req = getMockReq({
        currentUser: {},
        params: {
          formId: 'not-a-uuid',
        },
        query: {
          otherQueryThing: 'SOMETHING',
        },
      });
      const { res, next } = getMockRes();

      await hasFormRoles([Roles.OWNER])(req, res, next);

      expect(service.getUserForms).toHaveBeenCalledTimes(0);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  // TODO: These should be 403, but bundle all breaking changes in a small PR.
  describe('401 response when', () => {
    const expectedStatus = { status: 401 };

    test('no access to form', async () => {
      const req = getMockReq({
        currentUser: {},
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasFormRoles([Roles.OWNER])(req, res, next);

      expect(service.getUserForms).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.objectContaining(expectedStatus));
    });

    test('role not on form', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.FORM_DESIGNER, Roles.TEAM_MANAGER],
        },
      ]);
      const req = getMockReq({
        currentUser: {},
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasFormRoles([Roles.OWNER])(req, res, next);

      expect(service.getUserForms).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.objectContaining(expectedStatus));
    });

    test('roles not on form', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.FORM_DESIGNER, Roles.TEAM_MANAGER],
        },
      ]);
      const req = getMockReq({
        currentUser: {},
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasFormRoles([Roles.FORM_SUBMITTER, Roles.OWNER])(req, res, next);

      expect(service.getUserForms).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('handles error thrown by', () => {
    test('getUserForms', async () => {
      const error = new Error();
      service.getUserForms.mockRejectedValueOnce(error);
      const req = getMockReq({
        currentUser: {},
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasFormRoles([Roles.OWNER])(req, res, next);

      expect(service.getUserForms).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('allows', () => {
    test('role is exact match', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.OWNER],
        },
      ]);
      const req = getMockReq({
        currentUser: {},
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasFormRoles([Roles.OWNER])(req, res, next);

      expect(service.getUserForms).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    test('single role is start of subset', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.OWNER, Roles.TEAM_MANAGER],
        },
      ]);
      const req = getMockReq({
        currentUser: {},
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasFormRoles([Roles.OWNER])(req, res, next);

      expect(service.getUserForms).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    test('single role is middle of subset', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.FORM_DESIGNER, Roles.OWNER, Roles.TEAM_MANAGER],
        },
      ]);
      const req = getMockReq({
        currentUser: {},
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasFormRoles([Roles.OWNER])(req, res, next);

      expect(service.getUserForms).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    test('single role is end of subset', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.FORM_DESIGNER, Roles.FORM_SUBMITTER, Roles.OWNER],
        },
      ]);
      const req = getMockReq({
        currentUser: {},
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasFormRoles([Roles.OWNER])(req, res, next);

      expect(service.getUserForms).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    test('second role is start of subset', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.OWNER, Roles.TEAM_MANAGER],
        },
      ]);
      const req = getMockReq({
        currentUser: {},
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasFormRoles([Roles.FORM_DESIGNER, Roles.OWNER])(req, res, next);

      expect(service.getUserForms).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    test('second role is middle of subset', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.FORM_DESIGNER, Roles.OWNER, Roles.TEAM_MANAGER],
        },
      ]);
      const req = getMockReq({
        currentUser: {},
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasFormRoles([Roles.FORM_DESIGNER, Roles.OWNER])(req, res, next);

      expect(service.getUserForms).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    test('second role is end of subset', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.FORM_SUBMITTER, Roles.OWNER, Roles.SUBMISSION_REVIEWER],
        },
      ]);
      const req = getMockReq({
        currentUser: {},
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasFormRoles([Roles.FORM_DESIGNER, Roles.SUBMISSION_REVIEWER])(req, res, next);

      expect(service.getUserForms).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });
  });
});

describe('hasRolePermissions', () => {
  describe('when removing users from a team', () => {
    describe('as an owner', () => {
      it('should succeed with valid data', async () => {
        service.getUserForms = jest.fn().mockReturnValue([
          {
            userId: userId,
            formId: formId,
            roles: [Roles.OWNER],
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
          {
            id: '6',
            role: Roles.SUBMISSION_APPROVER,
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
              {
                id: '6',
                role: Roles.SUBMISSION_APPROVER,
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
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.SUBMISSION_APPROVER,
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
              {
                id: '6',
                role: Roles.SUBMISSION_APPROVER,
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
              {
                id: '6',
                role: Roles.SUBMISSION_APPROVER,
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
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.SUBMISSION_APPROVER,
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
              {
                id: '6',
                role: Roles.SUBMISSION_APPROVER,
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
              {
                id: '6',
                role: Roles.SUBMISSION_APPROVER,
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
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.SUBMISSION_APPROVER,
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
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.SUBMISSION_APPROVER,
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
              {
                id: '6',
                role: Roles.SUBMISSION_APPROVER,
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
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.SUBMISSION_APPROVER,
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
              {
                id: '6',
                role: Roles.SUBMISSION_APPROVER,
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
              {
                id: '6',
                role: Roles.SUBMISSION_APPROVER,
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
                {
                  userId: userId2,
                  formId: formId,
                  role: Roles.SUBMISSION_APPROVER,
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
              {
                id: '6',
                role: Roles.SUBMISSION_APPROVER,
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
