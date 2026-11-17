const { getMockReq, getMockRes } = require('@jest-mock/express');
const Problem = require('api-problem');
const { NotFoundError } = require('objection');
const uuid = require('uuid');

const { currentFileRecord, hasFileCreate } = require('../../../../../src/forms/file/middleware/filePermissions');
const authService = require('../../../../../src/forms/auth/service');
const service = require('../../../../../src/forms/file/service');

const fileId = uuid.v4();
const idpUserId = uuid.v4();

const formService = require('../../../../../src/forms/form/service');
const currentUserIdp = {
  idpUserId: idpUserId,
};

describe('currentFileRecord', () => {
  const readFileSpy = jest.spyOn(service, 'read');

  beforeEach(() => {
    readFileSpy.mockReset();
  });

  describe('403 response when', () => {
    const expectedStatus = { status: 403 };

    test('there is no current user on the request', async () => {
      const req = getMockReq({
        params: {
          fileId: fileId,
        },
      });
      const { res, next } = getMockRes();

      await currentFileRecord(req, res, next);

      expect(readFileSpy).toBeCalledTimes(0);
      expect(req.currentFileRecord).toEqual(undefined);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'File access to this ID is unauthorized.',
        })
      );
    });

    test('there is no file id on the request', async () => {
      const req = getMockReq({
        currentUser: currentUserIdp,
        params: {},
      });
      const { res, next } = getMockRes();

      await currentFileRecord(req, res, next);

      expect(readFileSpy).toBeCalledTimes(0);
      expect(req.currentFileRecord).toEqual(undefined);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'File access to this ID is unauthorized.',
        })
      );
    });

    test('there is no file record to be found', async () => {
      readFileSpy.mockImplementation(() => {
        return undefined;
      });
      const req = getMockReq({
        currentUser: currentUserIdp,
        params: {
          fileId: fileId,
        },
      });
      const { res, next } = getMockRes();

      await currentFileRecord(req, res, next);

      expect(readFileSpy).toBeCalledTimes(1);
      expect(readFileSpy).toBeCalledWith(fileId);
      expect(req.currentFileRecord).toEqual(undefined);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'File access to this ID is unauthorized.',
        })
      );
    });

    test('service.read throws an error', async () => {
      readFileSpy.mockImplementation(() => {
        throw new Error();
      });
      const req = getMockReq({
        currentUser: currentUserIdp,
        params: {
          fileId: fileId,
        },
      });
      const { res, next } = getMockRes();

      await currentFileRecord(req, res, next);

      expect(readFileSpy).toBeCalledTimes(1);
      expect(readFileSpy).toBeCalledWith(fileId);
      expect(req.currentFileRecord).toEqual(undefined);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'File access to this ID is unauthorized.',
        })
      );
    });
  });

  describe('success when', () => {
    const testRecord = {
      name: 'test',
    };

    test('an idp user on the request', async () => {
      readFileSpy.mockImplementation(() => {
        return testRecord;
      });
      const req = getMockReq({
        currentUser: currentUserIdp,
        params: { fileId: fileId },
      });
      const { res, next } = getMockRes();

      await currentFileRecord(req, res, next);

      expect(readFileSpy).toBeCalledTimes(1);
      expect(readFileSpy).toBeCalledWith(fileId);
      expect(req.currentFileRecord).toEqual(testRecord);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('an api key user on the request', async () => {
      readFileSpy.mockImplementation(() => {
        return testRecord;
      });
      const req = getMockReq({
        apiUser: true,
        params: { fileId: fileId },
      });
      const { res, next } = getMockRes();

      await currentFileRecord(req, res, next);

      expect(readFileSpy).toBeCalledWith(fileId);
      expect(req.currentFileRecord).toEqual(testRecord);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });
  });
});

describe('hasFileCreate', () => {
  const formId = uuid.v4();
  const publishedPublicForm = { id: formId, active: true, identityProviders: [{ code: 'public' }], versions: [{ published: true }] };
  const signedIn = { id: uuid.v4(), idpUserId: uuid.v4(), usernameIdp: 'jdoe@idir' };

  let readFormSpy;
  let getUserFormsSpy;

  beforeEach(() => {
    readFormSpy = jest.spyOn(formService, 'readForm');
    getUserFormsSpy = jest.spyOn(authService, 'getUserForms');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('400 response when', () => {
    test.each([
      ['an anonymous caller', undefined],
      ['a signed-in caller', signedIn],
    ])('there is no formId, for %s', async (_name, currentUser) => {
      const req = getMockReq({ currentUser, query: {} });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(readFormSpy).not.toBeCalled();
      expect(next).toBeCalledWith(expect.objectContaining({ status: 400, detail: 'formId is required as query parameter for file uploads' }));
    });

    const BAD_FORM_IDS = ['x', 'undefined', '00000000-0000-0000-0000-00000000000z', [uuid.v4(), uuid.v4()]];
    test.each(
      BAD_FORM_IDS.flatMap((badFormId) => [
        [badFormId, 'an anonymous caller', undefined],
        [badFormId, 'a signed-in caller', signedIn],
      ])
    )('the formId is not a UUID (%p), for %s', async (badFormId, _name, currentUser) => {
      const req = getMockReq({ currentUser, query: { formId: badFormId } });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(readFormSpy).not.toBeCalled();
      expect(next).toBeCalledWith(expect.objectContaining({ status: 400, detail: 'formId must be a valid UUID' }));
    });
  });

  describe('404 response when', () => {
    test.each([
      ['an anonymous caller', undefined],
      ['a signed-in caller', signedIn],
    ])('readForm finds no active form (NotFoundError), for %s', async (_name, currentUser) => {
      readFormSpy.mockRejectedValue(new NotFoundError({ modelClass: { name: 'Form' } }));
      const req = getMockReq({ currentUser, query: { formId } });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(getUserFormsSpy).not.toBeCalled();
      expect(next).toBeCalledWith(expect.objectContaining({ status: 404, detail: 'Form not found' }));
    });
  });

  describe('anonymous callers', () => {
    test('are allowed on a published public form, without a form access lookup', async () => {
      readFormSpy.mockResolvedValue(publishedPublicForm);
      const req = getMockReq({ currentUser: { username: 'public', public: true }, query: { formId } });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(readFormSpy).toBeCalledWith(formId);
      expect(getUserFormsSpy).not.toBeCalled();
      expect(next).toBeCalledWith();
    });

    test('get a 403 on a form that does not allow public submissions', async () => {
      readFormSpy.mockResolvedValue({ ...publishedPublicForm, identityProviders: [{ code: 'idir' }] });
      const req = getMockReq({ query: { formId } });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(next).toBeCalledWith(expect.objectContaining({ status: 403, detail: 'Authentication required for file uploads on this form' }));
    });

    test('get a 403 on a public form with no published version', async () => {
      readFormSpy.mockResolvedValue({ ...publishedPublicForm, versions: [{ published: false }] });
      const req = getMockReq({ query: { formId } });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(next).toBeCalledWith(expect.objectContaining({ status: 403, detail: 'This form is not accepting uploads.' }));
    });
  });

  describe('signed-in callers', () => {
    test('are checked against their access to the form, with the request headers', async () => {
      readFormSpy.mockResolvedValue(publishedPublicForm);
      getUserFormsSpy.mockResolvedValue([{ formId, permissions: ['form_read', 'submission_create'] }]);
      const req = getMockReq({ currentUser: signedIn, query: { formId }, headers: { 'x-tenant-id': 'tenant' } });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(getUserFormsSpy).toBeCalledWith(signedIn, { active: true, formId }, req.headers);
      expect(next).toBeCalledWith();
    });

    test('get a 403 when they have no access to the form', async () => {
      readFormSpy.mockResolvedValue({ ...publishedPublicForm, identityProviders: [{ code: 'idir' }] });
      getUserFormsSpy.mockResolvedValue([]);
      const req = getMockReq({ currentUser: signedIn, query: { formId } });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(next).toBeCalledWith(expect.objectContaining({ status: 403, detail: 'You do not have access to upload files to this form.' }));
    });

    test('pass on a Problem from the form access lookup (tenant group roles unavailable)', async () => {
      readFormSpy.mockResolvedValue(publishedPublicForm);
      const problem = new Problem(502, { detail: 'Unable to verify your group membership. Please try again later.' });
      getUserFormsSpy.mockRejectedValue(problem);
      const req = getMockReq({ currentUser: signedIn, query: { formId } });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(next).toBeCalledWith(problem);
    });

    test('get a 500 for any other error from the form access lookup', async () => {
      readFormSpy.mockResolvedValue(publishedPublicForm);
      getUserFormsSpy.mockRejectedValue(new Error('Headers required for tenant user form access'));
      const req = getMockReq({ currentUser: signedIn, query: { formId } });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(next).toBeCalledWith(expect.objectContaining({ status: 500, detail: 'Unable to upload file at this time. Please try again later.' }));
    });
  });

  describe('the submission being edited (formSubmissionId)', () => {
    const submissionId = uuid.v4();
    const loginOnlyUnpublished = { ...publishedPublicForm, identityProviders: [{ code: 'idir' }], versions: [{ published: false }] };
    let getSubmissionFormSpy;
    let checkSubmissionPermissionSpy;

    beforeEach(() => {
      getSubmissionFormSpy = jest.spyOn(authService, 'getSubmissionForm').mockResolvedValue({ submission: { submissionId, formId, deleted: false }, form: { id: formId } });
      checkSubmissionPermissionSpy = jest.spyOn(authService, 'checkSubmissionPermission').mockResolvedValue({ permission: 'submission_update' });
    });

    const run = async (currentUser, query) => {
      const req = getMockReq({ currentUser, query: { formId, ...query } });
      const { res, next } = getMockRes();
      await hasFileCreate(req, res, next);
      return next;
    };

    test.each([['x'], [[uuid.v4(), uuid.v4()]]])('gets a 400 when it is not a UUID (%p)', async (bad) => {
      const next = await run(signedIn, { formSubmissionId: bad });

      expect(readFormSpy).not.toBeCalled();
      expect(next).toBeCalledWith(expect.objectContaining({ status: 400, detail: 'formSubmissionId must be a valid UUID' }));
    });

    test('lets someone who can update that submission upload, without form access or a published version', async () => {
      readFormSpy.mockResolvedValue(loginOnlyUnpublished);
      getUserFormsSpy.mockResolvedValue([]);

      const next = await run(signedIn, { formSubmissionId: submissionId });

      expect(getSubmissionFormSpy).toBeCalledWith(submissionId);
      expect(checkSubmissionPermissionSpy).toBeCalledWith(signedIn, submissionId, ['submission_update']);
      expect(next).toBeCalledWith();
    });

    test('is not looked up when access to the form already allows the upload', async () => {
      readFormSpy.mockResolvedValue(publishedPublicForm);
      getUserFormsSpy.mockResolvedValue([{ formId, permissions: ['submission_create'] }]);

      const next = await run(signedIn, { formSubmissionId: submissionId });

      expect(getSubmissionFormSpy).not.toBeCalled();
      expect(next).toBeCalledWith();
    });

    test.each([
      ['on another form', () => getSubmissionFormSpy.mockResolvedValue({ submission: { submissionId, formId: uuid.v4(), deleted: false }, form: { id: uuid.v4() } })],
      ['deleted', () => getSubmissionFormSpy.mockResolvedValue({ submission: { submissionId, formId, deleted: true }, form: { id: formId } })],
      ['not found', () => getSubmissionFormSpy.mockRejectedValue(new NotFoundError({ modelClass: { name: 'SubmissionMetadata' } }))],
      ['one the caller cannot update', () => checkSubmissionPermissionSpy.mockResolvedValue(undefined)],
    ])('keeps the refusal for a submission %s', async (_name, arrange) => {
      readFormSpy.mockResolvedValue(loginOnlyUnpublished);
      getUserFormsSpy.mockResolvedValue([]);
      arrange();

      const next = await run(signedIn, { formSubmissionId: submissionId });

      expect(next).toBeCalledWith(expect.objectContaining({ status: 403, detail: 'You do not have access to upload files to this form.' }));
    });

    test('does not let a submission on another form reach the permission check', async () => {
      readFormSpy.mockResolvedValue(loginOnlyUnpublished);
      getUserFormsSpy.mockResolvedValue([]);
      getSubmissionFormSpy.mockResolvedValue({ submission: { submissionId, formId: uuid.v4(), deleted: false }, form: { id: uuid.v4() } });

      await run(signedIn, { formSubmissionId: submissionId });

      expect(checkSubmissionPermissionSpy).not.toBeCalled();
    });

    test('is not used for an anonymous caller', async () => {
      readFormSpy.mockResolvedValue({ ...publishedPublicForm, versions: [{ published: false }] });

      const next = await run(undefined, { formSubmissionId: submissionId });

      expect(getSubmissionFormSpy).not.toBeCalled();
      expect(next).toBeCalledWith(expect.objectContaining({ status: 403, detail: 'This form is not accepting uploads.' }));
    });

    test('passes on an unexpected error from the submission lookup as a 500', async () => {
      readFormSpy.mockResolvedValue(loginOnlyUnpublished);
      getUserFormsSpy.mockResolvedValue([]);
      getSubmissionFormSpy.mockRejectedValue(new Error('connection lost'));

      const next = await run(signedIn, { formSubmissionId: submissionId });

      expect(next).toBeCalledWith(expect.objectContaining({ status: 500 }));
    });
  });

  describe('handles errors', () => {
    test('form service throws error', async () => {
      readFormSpy.mockRejectedValue(new Error('Database connection failed'));
      const req = getMockReq({ query: { formId } });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(next).toBeCalledWith(expect.objectContaining({ status: 500, detail: 'Unable to upload file at this time. Please try again later.' }));
    });
  });
});
