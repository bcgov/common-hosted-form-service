const { getMockReq, getMockRes } = require('@jest-mock/express');
const uuid = require('uuid');

const {
  currentUser,
  filterMultipleSubmissions,
  hasFormPermissions,
  hasFormRoles,
  hasRoleDeletePermissions,
  hasRoleModifyPermissions,
  hasSubmissionPermissions,
} = require('../../../../../src/forms/auth/middleware/userAccess');

const jwtService = require('../../../../../src/components/jwtService');
const rbacService = require('../../../../../src/forms/rbac/service');

const service = require('../../../../../src/forms/auth/service');

const formId = uuid.v4();
const formSubmissionId = uuid.v4();
const userId = uuid.v4();
const userId2 = uuid.v4();

const Roles = {
  OWNER: 'owner',
  TEAM_MANAGER: 'team_manager',
  FORM_DESIGNER: 'form_designer',
  SUBMISSION_APPROVER: 'submission_approver',
  SUBMISSION_REVIEWER: 'submission_reviewer',
  FORM_SUBMITTER: 'form_submitter',
};

afterEach(() => {
  jest.clearAllMocks();
});

// External dependencies used by the implementation are:
//  - jwtService.getBearerToken: to get the bearer token.
//  - jwtService.getTokenPayload to get the payload from the bearer token.
//  - jwtService.validateAccessToken: to validate a bearer token.
//  - service.login: to create the object for req.currentUser.
//
describe('currentUser', () => {
  // Bearer token and its authorization header.
  const bearerToken = Math.random().toString(36).substring(2);

  // Default mock of the token validation.
  jwtService.getBearerToken = jest.fn().mockReturnValue(bearerToken);
  jwtService.getTokenPayload = jest.fn().mockReturnValue({ token: 'payload' });
  jwtService.validateAccessToken = jest.fn().mockReturnValue(true);

  // Default mock of the service login.
  const mockUser = { user: 'me' };
  service.login = jest.fn().mockReturnValue(mockUser);

  describe('401 response when', () => {
    const expectedStatus = { status: 401 };

    test('the token is not valid', async () => {
      jwtService.validateAccessToken.mockReturnValueOnce(false);
      const req = getMockReq();
      const { res, next } = getMockRes();

      await currentUser(req, res, next);

      expect(jwtService.getBearerToken).toBeCalledTimes(1);
      expect(jwtService.validateAccessToken).toBeCalledTimes(1);
      expect(jwtService.validateAccessToken).toBeCalledWith(bearerToken);
      expect(service.login).toBeCalledTimes(0);
      expect(req.currentUser).toEqual(undefined);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Authorization token is invalid.',
        })
      );
    });
  });

  it('passes on the error if a service fails unexpectedly', async () => {
    service.login.mockRejectedValueOnce(new Error());
    const req = getMockReq();
    const { res, next } = getMockRes();

    await currentUser(req, res, next);

    expect(jwtService.getBearerToken).toBeCalledTimes(1);
    expect(jwtService.validateAccessToken).toBeCalledTimes(1);
    expect(jwtService.validateAccessToken).toBeCalledWith(bearerToken);
    expect(service.login).toBeCalledTimes(1);
    expect(req.currentUser).toEqual(undefined);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(expect.any(Error));
  });

  it('gets the current user with no bearer token', async () => {
    jwtService.getBearerToken.mockReturnValueOnce(null);
    jwtService.getTokenPayload.mockReturnValueOnce(null);
    const req = getMockReq();
    const { res, next } = getMockRes();

    await currentUser(req, res, next);

    expect(jwtService.validateAccessToken).toBeCalledTimes(0);
    expect(service.login).toBeCalledTimes(1);
    expect(service.login).toBeCalledWith(null);
    expect(req.currentUser).toEqual(mockUser);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith();
  });

  it('does not keycloak validate with no bearer token', async () => {
    jwtService.getBearerToken.mockReturnValueOnce(null);
    jwtService.getTokenPayload.mockReturnValueOnce(null);
    const req = getMockReq();
    const { res, next } = getMockRes();

    await currentUser(req, res, next);

    expect(jwtService.validateAccessToken).toBeCalledTimes(0);
    expect(req.currentUser).toEqual(mockUser);
    expect(service.login).toBeCalledTimes(1);
    expect(service.login).toBeCalledWith(null);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith();
  });

  it('gets the current user with valid request', async () => {
    const req = getMockReq();
    const { res, next } = getMockRes();

    await currentUser(req, res, next);

    expect(jwtService.validateAccessToken).toBeCalledTimes(1);
    expect(jwtService.getBearerToken).toBeCalledTimes(1);
    expect(jwtService.validateAccessToken).toBeCalledWith(bearerToken);
    expect(service.login).toBeCalledTimes(1);
    expect(service.login).toBeCalledWith({ token: 'payload' });
    expect(req.currentUser).toEqual(mockUser);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith();
  });
});

// External dependencies used by the implementation are:
//  - service.getMultipleSubmission: gets multiple submissions.
//  - service.getUserForms: gets the forms that the user can access.
//
describe('filterMultipleSubmissions', () => {
  // Default mock value where there are no submissions to get.
  service.getMultipleSubmission = jest.fn().mockReturnValue([]);

  // Default mock value where the user has no access to forms.
  service.getUserForms = jest.fn().mockReturnValue([]);

  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    test('the request has no formId', async () => {
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

      await filterMultipleSubmissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('the formId is not a uuid', async () => {
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

      await filterMultipleSubmissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('401 response when', () => {
    const expectedStatus = { status: 401 };

    // TODO: This should be a 400, but bundle all breaking changes in a small PR.
    test('the request does not have a body', async () => {
      const req = getMockReq({
        currentUser: {},
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await filterMultipleSubmissions(req, res, next);

      expect(service.getUserForms).toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'SubmissionIds not found on request.',
        })
      );
    });

    // TODO: This should be a 400, but bundle all breaking changes in a small PR.
    test('there is no req.body.submissionIds', async () => {
      const req = getMockReq({
        body: {},
        currentUser: {},
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await filterMultipleSubmissions(req, res, next);

      expect(service.getUserForms).toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'SubmissionIds not found on request.',
        })
      );
    });

    // TODO: This should be a 400, but bundle all breaking changes in a small PR.
    test('the req.body.submissionIds is not an array', async () => {
      const req = getMockReq({
        body: {
          submissionIds: uuid.v4(),
        },
        currentUser: {},
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await filterMultipleSubmissions(req, res, next);

      expect(service.getUserForms).toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'SubmissionIds not found on request.',
        })
      );
    });

    // TODO: This should be a 400, but bundle all breaking changes in a small PR.
    test('the req.body.submissionIds does not have a valid uuid', async () => {
      const req = getMockReq({
        body: {
          submissionIds: ['not-a-uuid'],
        },
        currentUser: {},
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await filterMultipleSubmissions(req, res, next);

      expect(service.getUserForms).toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Invalid submissionId(s) in the submissionIds list.',
        })
      );
    });

    // TODO: This should be a 400, but bundle all breaking changes in a small PR.
    test('the req.body.submissionIds does not have all valid uuids', async () => {
      const req = getMockReq({
        body: {
          submissionIds: [uuid.v4(), 'not-a-uuid', uuid.v4()],
        },
        currentUser: {},
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await filterMultipleSubmissions(req, res, next);

      expect(service.getUserForms).toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Invalid submissionId(s) in the submissionIds list.',
        })
      );
    });

    test('the formIdWithDeletePermission does not match', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
        },
      ]);
      const req = getMockReq({
        body: {
          submissionIds: [uuid.v4()],
        },
        currentUser: {},
        formIdWithDeletePermission: uuid.v4(),
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await filterMultipleSubmissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Current user does not have required permission(s) for to delete submissions',
        })
      );
    });

    test('the submission form id does not match', async () => {
      service.getMultipleSubmission.mockReturnValueOnce([
        {
          formId: uuid.v4(),
        },
      ]);
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
        },
      ]);
      const req = getMockReq({
        body: {
          submissionIds: [uuid.v4()],
        },
        currentUser: {},
        formIdWithDeletePermission: formId,
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await filterMultipleSubmissions(req, res, next);

      expect(service.getMultipleSubmission).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Current user does not have required permission(s) for some submissions in the submissionIds list.',
        })
      );
    });

    test('the submission lengths do not match', async () => {
      service.getMultipleSubmission.mockReturnValueOnce([
        {
          formId: formId,
        },
      ]);
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
        },
      ]);
      const req = getMockReq({
        body: {
          submissionIds: [uuid.v4(), uuid.v4()],
        },
        currentUser: {},
        formIdWithDeletePermission: formId,
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await filterMultipleSubmissions(req, res, next);

      expect(service.getMultipleSubmission).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Current user does not have required permission(s) for some submissions in the submissionIds list.',
        })
      );
    });
  });

  describe('handles error thrown by', () => {
    test('getMultipleSubmission', async () => {
      const error = new Error();
      service.getMultipleSubmission.mockRejectedValueOnce(error);
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
        },
      ]);
      const req = getMockReq({
        body: { submissionIds: [] },
        currentUser: {},
        formIdWithDeletePermission: formId,
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await filterMultipleSubmissions(req, res, next);

      expect(service.getMultipleSubmission).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(error);
    });

    test('getUserForms', async () => {
      const error = new Error();
      service.getUserForms.mockRejectedValueOnce(error);
      const req = getMockReq({
        body: { submissionIds: [] },
        currentUser: {},
        formIdWithDeletePermission: formId,
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await filterMultipleSubmissions(req, res, next);

      expect(service.getMultipleSubmission).toBeCalledTimes(0);
      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(error);
    });
  });

  describe('allows', () => {
    test('an empty array of submission ids', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
        },
      ]);
      const req = getMockReq({
        body: { submissionIds: [] },
        currentUser: {},
        formIdWithDeletePermission: formId,
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await filterMultipleSubmissions(req, res, next);

      expect(service.getUserForms).toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('one submission id', async () => {
      service.getMultipleSubmission.mockReturnValueOnce([
        {
          formId: formId,
        },
      ]);
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
        },
      ]);
      const req = getMockReq({
        body: { submissionIds: [uuid.v4()] },
        currentUser: {},
        formIdWithDeletePermission: formId,
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await filterMultipleSubmissions(req, res, next);

      expect(service.getMultipleSubmission).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('three submission ids', async () => {
      service.getMultipleSubmission.mockReturnValueOnce([
        {
          formId: formId,
        },
        {
          formId: formId,
        },
        {
          formId: formId,
        },
      ]);
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
        },
      ]);
      const req = getMockReq({
        body: { submissionIds: [uuid.v4(), uuid.v4(), uuid.v4()] },
        currentUser: {},
        formIdWithDeletePermission: formId,
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await filterMultipleSubmissions(req, res, next);

      expect(service.getMultipleSubmission).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });
  });
});

// External dependencies used by the implementation are:
//  - service.getUserForms: gets the forms that the user can access.
//
describe('hasFormPermissions', () => {
  // Default mock value where the user has no access to forms.
  service.getUserForms = jest.fn().mockReturnValue([]);

  it('returns a middleware function', async () => {
    const middleware = hasFormPermissions(['FORM_READ']);

    expect(middleware).toBeInstanceOf(Function);
  });

  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    test('the request has no formId', async () => {
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

      expect(service.getUserForms).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('the formId is not a uuid', async () => {
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

      expect(service.getUserForms).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('401 response when', () => {
    const expectedStatus = { status: 401 };

    // TODO: This should be a 403, but bundle all breaking changes in a small PR.
    test('the user does not have access to the form', async () => {
      const req = getMockReq({
        currentUser: {},
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasFormPermissions(['FORM_READ'])(req, res, next);

      expect(service.getUserForms).toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    // TODO: This should be a 403, but bundle all breaking changes in a small PR.
    test('the expected permissions are not included', async () => {
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

      expect(service.getUserForms).toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    // TODO: This should be a 403, but bundle all breaking changes in a small PR.
    test('the permissions are a subset but not everything', async () => {
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

      expect(service.getUserForms).toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('500 response when', () => {
    const expectedStatus = { status: 500 };

    test('the request has no current user', async () => {
      const req = getMockReq({
        params: { formId: formId },
      });
      const { res, next } = getMockRes();

      await hasFormPermissions(['FORM_READ'])(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('allows', () => {
    test('a valid API key user', async () => {
      const req = getMockReq({
        apiUser: true,
        params: { formId: formId },
      });
      const { res, next } = getMockRes();

      await hasFormPermissions(['FORM_READ'])(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('the expected permissions are included', async () => {
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

      expect(service.getUserForms).toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('the expected permissions are included with query formId', async () => {
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

      expect(service.getUserForms).toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('the user has deleted form access', async () => {
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

      expect(service.getUserForms).toBeCalled();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });
  });
});

// External dependencies used by the implementation are:
//  - service.checkSubmissionPermission: gets whether the user has permission.
//  - service.getSubmissionForm: gets the submission that the user can access.
//  - service.getUserForms: gets the forms that the user can access.
//
describe('hasSubmissionPermissions', () => {
  // Default mock value where the user has no access to submission.
  service.checkSubmissionPermission = jest.fn().mockReturnValue(false);

  // Default mock value where there is no submission.
  service.getSubmissionForm = jest.fn().mockReturnValue();

  // Default mock value where the user has no access to forms.
  service.getUserForms = jest.fn().mockReturnValue([]);

  it('returns a middleware function', () => {
    const middleware = hasSubmissionPermissions(['submission_read']);

    expect(middleware).toBeInstanceOf(Function);
  });

  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    test('the request has no formSubmissionId', async () => {
      const req = getMockReq();
      const { res, next } = getMockRes();

      await hasSubmissionPermissions(['submission_read'])(req, res, next);

      expect(service.checkSubmissionPermission).toBeCalledTimes(0);
      expect(service.getSubmissionForm).toBeCalledTimes(0);
      expect(service.getUserForms).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('the formSubmissionId is not a uuid', async () => {
      const req = getMockReq({
        currentUser: {},
        params: {
          formSubmissionId: 'not-a-uuid',
        },
      });
      const { res, next } = getMockRes();

      await hasSubmissionPermissions(['submission_read'])(req, res, next);

      expect(service.checkSubmissionPermission).toBeCalledTimes(0);
      expect(service.getSubmissionForm).toBeCalledTimes(0);
      expect(service.getUserForms).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('401 response when', () => {
    const expectedStatus = { status: 401 };

    test('deleted submission when no current user', async () => {
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

      expect(service.checkSubmissionPermission).toBeCalledTimes(0);
      expect(service.getSubmissionForm).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('deleted submission', async () => {
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

      expect(service.checkSubmissionPermission).toBeCalledTimes(0);
      expect(service.getSubmissionForm).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('user has no forms for deleted submission', async () => {
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

      expect(service.checkSubmissionPermission).toBeCalledTimes(0);
      expect(service.getSubmissionForm).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('user has no form access for deleted submission', async () => {
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

      expect(service.checkSubmissionPermission).toBeCalledTimes(0);
      expect(service.getSubmissionForm).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('user only has some form access for deleted submission', async () => {
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

      expect(service.checkSubmissionPermission).toBeCalledTimes(0);
      expect(service.getSubmissionForm).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('public access and no read permission', async () => {
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

      expect(service.checkSubmissionPermission).toBeCalledTimes(1);
      expect(service.getSubmissionForm).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('public access and more than read permission', async () => {
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

      expect(service.checkSubmissionPermission).toBeCalledTimes(1);
      expect(service.getSubmissionForm).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('form does not have the public idp', async () => {
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

      expect(service.checkSubmissionPermission).toBeCalledTimes(1);
      expect(service.getSubmissionForm).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('handles error thrown by', () => {
    test('getSubmissionForm', async () => {
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

      expect(service.checkSubmissionPermission).toBeCalledTimes(0);
      expect(service.getSubmissionForm).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(error);
    });

    test('getUserForms', async () => {
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

      expect(service.checkSubmissionPermission).toBeCalledTimes(0);
      expect(service.getSubmissionForm).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(error);
    });
  });

  describe('allows', () => {
    test('a valid API key user', async () => {
      const req = getMockReq({
        apiUser: true,
        params: {
          formSubmissionId: formSubmissionId,
        },
      });
      const { res, next } = getMockRes();

      await hasSubmissionPermissions(['submission_read'])(req, res, next);

      expect(service.checkSubmissionPermission).toBeCalledTimes(0);
      expect(service.getSubmissionForm).toBeCalledTimes(0);
      expect(service.getUserForms).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('the user has the exact form permissions', async () => {
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

      expect(service.checkSubmissionPermission).toBeCalledTimes(0);
      expect(service.getSubmissionForm).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('the user has extra form permissions', async () => {
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

      expect(service.checkSubmissionPermission).toBeCalledTimes(0);
      expect(service.getSubmissionForm).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('public form and read permission', async () => {
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

      expect(service.checkSubmissionPermission).toBeCalledTimes(0);
      expect(service.getSubmissionForm).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('public form and read permission with extra idp', async () => {
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

      expect(service.checkSubmissionPermission).toBeCalledTimes(0);
      expect(service.getSubmissionForm).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('the permission check succeeds', async () => {
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

      expect(service.checkSubmissionPermission).toBeCalledTimes(1);
      expect(service.getSubmissionForm).toBeCalledTimes(1);
      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });
  });
});

// External dependencies used by the implementation are:
//  - service.getUserForms: gets the forms that the user can access.
//
describe('hasFormRoles', () => {
  // Default mock value where the user has no access to forms.
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

      expect(service.getUserForms).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
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

      expect(service.getUserForms).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
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

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
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

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
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

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
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

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(error);
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

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
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

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
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

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
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

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
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

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
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

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
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

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });
  });
});

// External dependencies used by the implementation are:
//  - service.getUserForms: gets the forms that the user can access.
//  - rbacService.readUserRole: gets the roles that user has on a form.
//
describe('hasRoleDeletePermissions', () => {
  // Default mock value where the user has no access to forms.
  service.getUserForms = jest.fn().mockReturnValue([]);

  // Default mock value where the user has no roles.
  rbacService.readUserRole = jest.fn().mockReturnValue([]);

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

      await hasRoleDeletePermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(0);
      expect(rbacService.readUserRole).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Bad formId',
        })
      );
    });

    test('formId not a uuid', async () => {
      const req = getMockReq({
        currentUser: {
          id: userId,
        },
        params: {
          formId: 'not-a-uuid',
        },
        query: {
          otherQueryThing: 'SOMETHING',
        },
      });
      const { res, next } = getMockRes();

      await hasRoleDeletePermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(0);
      expect(rbacService.readUserRole).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Bad formId',
        })
      );
    });
  });

  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    test('user id not a uuid', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.TEAM_MANAGER],
        },
      ]);
      const req = getMockReq({
        body: ['not-a-uuid'],
        currentUser: {
          id: userId,
        },
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasRoleDeletePermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(rbacService.readUserRole).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Bad userId',
        })
      );
    });
  });

  describe('401 response when', () => {
    const expectedStatus = { status: 401 };

    test('owner cannot remove self', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.FORM_DESIGNER, Roles.OWNER, Roles.TEAM_MANAGER],
        },
      ]);
      const req = getMockReq({
        body: [userId],
        currentUser: {
          id: userId,
        },
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasRoleDeletePermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(rbacService.readUserRole).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: "You can't remove yourself from this form.",
        })
      );
    });

    test('non-owner cannot remove an owner', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.TEAM_MANAGER],
        },
      ]);
      rbacService.readUserRole.mockReturnValueOnce([{ role: Roles.OWNER }]);
      const req = getMockReq({
        body: [userId2],
        currentUser: {
          id: userId,
        },
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasRoleDeletePermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(rbacService.readUserRole).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: "You can not update an owner's roles.",
        })
      );
    });

    test('non-owner cannot remove a form designer', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.TEAM_MANAGER],
        },
      ]);
      rbacService.readUserRole.mockReturnValueOnce([{ role: Roles.FORM_DESIGNER }]);
      const req = getMockReq({
        body: [userId2],
        currentUser: {
          id: userId,
        },
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasRoleDeletePermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(rbacService.readUserRole).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: "You can't remove a form designer role.",
        })
      );
    });
  });

  describe('allows', () => {
    test('non-owner can remove submission reviewer', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.TEAM_MANAGER],
        },
      ]);
      rbacService.readUserRole.mockReturnValueOnce([{ role: Roles.SUBMISSION_REVIEWER }]);
      const req = getMockReq({
        body: [userId2],
        currentUser: {
          id: userId,
        },
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasRoleDeletePermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(rbacService.readUserRole).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('owner can remove an owner', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.OWNER],
        },
      ]);
      const req = getMockReq({
        body: [userId2],
        currentUser: {
          id: userId,
        },
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasRoleDeletePermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(rbacService.readUserRole).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('owner can remove a form designer', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.OWNER],
        },
      ]);
      const req = getMockReq({
        body: [userId2],
        currentUser: {
          id: userId,
        },
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasRoleDeletePermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(rbacService.readUserRole).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('owner can remove a form designer with form id in query', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.OWNER],
        },
      ]);
      const req = getMockReq({
        body: [userId2],
        currentUser: {
          id: userId,
        },
        query: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasRoleDeletePermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(rbacService.readUserRole).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });
  });
});

// External dependencies used by the implementation are:
//  - service.getUserForms: gets the forms that the user can access.
//  - rbacService.readUserRole: gets the roles that user has on a form.
//
describe('hasRoleModifyPermissions', () => {
  // Default mock value where the user has no access to forms.
  service.getUserForms = jest.fn().mockReturnValue([]);

  // Default mock value where the user has no roles.
  rbacService.readUserRole = jest.fn().mockReturnValue([]);

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

      await hasRoleModifyPermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(0);
      expect(rbacService.readUserRole).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Bad formId',
        })
      );
    });

    test('formId not a uuid', async () => {
      const req = getMockReq({
        currentUser: {
          id: userId,
        },
        params: {
          formId: 'not-a-uuid',
        },
        query: {
          otherQueryThing: 'SOMETHING',
        },
      });
      const { res, next } = getMockRes();

      await hasRoleModifyPermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(0);
      expect(rbacService.readUserRole).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Bad formId',
        })
      );
    });
  });

  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    test('user id missing', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.FORM_DESIGNER, Roles.OWNER, Roles.TEAM_MANAGER],
        },
      ]);
      const req = getMockReq({
        currentUser: {
          id: userId,
        },
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await hasRoleModifyPermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(rbacService.readUserRole).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Bad userId',
        })
      );
    });

    test('user id not a uuid', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.FORM_DESIGNER, Roles.OWNER, Roles.TEAM_MANAGER],
        },
      ]);
      const req = getMockReq({
        currentUser: {
          id: userId,
        },
        params: {
          formId: formId,
          userId: 'not-a-uuid',
        },
      });
      const { res, next } = getMockRes();

      await hasRoleModifyPermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(rbacService.readUserRole).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Bad userId',
        })
      );
    });
  });

  describe('401 response when', () => {
    const expectedStatus = { status: 401 };

    test('non-owner cannot remove own team manager', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.TEAM_MANAGER],
        },
      ]);
      rbacService.readUserRole.mockReturnValueOnce([{ role: Roles.TEAM_MANAGER }]);
      const req = getMockReq({
        body: [{ role: Roles.SUBMISSION_APPROVER }],
        currentUser: {
          id: userId,
        },
        params: {
          formId: formId,
          userId: userId,
        },
      });
      const { res, next } = getMockRes();

      await hasRoleModifyPermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(rbacService.readUserRole).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: "You can't remove your own team manager role.",
        })
      );
    });

    test('non-owner cannot update an owner', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.TEAM_MANAGER],
        },
      ]);
      rbacService.readUserRole.mockReturnValueOnce([{ role: Roles.OWNER }]);
      const req = getMockReq({
        body: [{ role: Roles.SUBMISSION_APPROVER }],
        currentUser: {
          id: userId,
        },
        params: {
          formId: formId,
          userId: userId2,
        },
      });
      const { res, next } = getMockRes();

      await hasRoleModifyPermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(rbacService.readUserRole).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: "You can't update an owner's roles.",
        })
      );
    });

    test('non-owner cannot add an owner', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.TEAM_MANAGER],
        },
      ]);
      rbacService.readUserRole.mockReturnValueOnce([{ role: Roles.TEAM_MANAGER }]);
      const req = getMockReq({
        body: [{ role: Roles.OWNER }],
        currentUser: {
          id: userId,
        },
        params: {
          formId: formId,
          userId: userId2,
        },
      });
      const { res, next } = getMockRes();

      await hasRoleModifyPermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(rbacService.readUserRole).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: "You can't add an owner role.",
        })
      );
    });

    test('non-owner cannot remove designer', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.TEAM_MANAGER],
        },
      ]);
      rbacService.readUserRole.mockReturnValueOnce([{ role: Roles.FORM_DESIGNER }]);
      const req = getMockReq({
        body: [{ role: Roles.SUBMISSION_APPROVER }],
        currentUser: {
          id: userId,
        },
        params: {
          formId: formId,
          userId: userId2,
        },
      });
      const { res, next } = getMockRes();

      await hasRoleModifyPermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(rbacService.readUserRole).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: "You can't remove a form designer role.",
        })
      );
    });

    test('non-owner cannot add designer', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.TEAM_MANAGER],
        },
      ]);
      rbacService.readUserRole.mockReturnValueOnce([{ role: Roles.TEAM_MANAGER }]);
      const req = getMockReq({
        body: [{ role: Roles.FORM_DESIGNER }],
        currentUser: {
          id: userId,
        },
        params: {
          formId: formId,
          userId: userId2,
        },
      });
      const { res, next } = getMockRes();

      await hasRoleModifyPermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(rbacService.readUserRole).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: "You can't add a form designer role.",
        })
      );
    });
  });

  describe('allows', () => {
    test('non-owner can add approver', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.TEAM_MANAGER],
        },
      ]);
      rbacService.readUserRole.mockReturnValueOnce([]);
      const req = getMockReq({
        body: [
          {
            role: Roles.SUBMISSION_APPROVER,
          },
        ],
        currentUser: {
          id: userId,
        },
        params: {
          formId: formId,
          userId: userId2,
        },
      });
      const { res, next } = getMockRes();

      await hasRoleModifyPermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(rbacService.readUserRole).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('non-owner can add approver to designer', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.TEAM_MANAGER],
        },
      ]);
      rbacService.readUserRole.mockReturnValueOnce([{ role: Roles.FORM_DESIGNER }]);
      const req = getMockReq({
        body: [
          {
            role: Roles.FORM_DESIGNER,
          },
          {
            role: Roles.SUBMISSION_APPROVER,
          },
        ],
        currentUser: {
          id: userId,
        },
        params: {
          formId: formId,
          userId: userId2,
        },
      });
      const { res, next } = getMockRes();

      await hasRoleModifyPermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(rbacService.readUserRole).toBeCalledTimes(1);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('owner can add owner', async () => {
      service.getUserForms.mockReturnValueOnce([
        {
          formId: formId,
          roles: [Roles.OWNER],
        },
      ]);
      const req = getMockReq({
        body: [{ role: Roles.OWNER }],
        currentUser: {
          id: userId,
        },
        params: {
          formId: formId,
          userId: userId2,
        },
      });
      const { res, next } = getMockRes();

      await hasRoleModifyPermissions(req, res, next);

      expect(service.getUserForms).toBeCalledTimes(1);
      expect(rbacService.readUserRole).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });
  });
});
