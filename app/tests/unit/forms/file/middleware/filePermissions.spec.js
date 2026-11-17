const { getMockReq, getMockRes } = require('@jest-mock/express');
const { NotFoundError } = require('objection');
const uuid = require('uuid');

const { currentFileRecord, hasFileCreate } = require('../../../../../src/forms/file/middleware/filePermissions');
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

  // Mock the form service
  const readFormSpy = jest.spyOn(formService, 'readForm');

  beforeEach(() => {
    readFormSpy.mockReset();
  });

  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    test('there is no formId in the request', async () => {
      const req = getMockReq({
        query: {}, // No formId
      });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'formId is required as query parameter for file uploads',
        })
      );
    });

    test.each([['x'], ['00000000-0000-0000-0000-00000000000z'], [[uuid.v4(), uuid.v4()]]])('the formId is not a UUID (%p)', async (badFormId) => {
      const req = getMockReq({ query: { formId: badFormId } });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(readFormSpy).not.toBeCalled();
      expect(next).toBeCalledWith(expect.objectContaining({ status: 400, detail: 'formId must be a valid UUID' }));
    });
  });

  describe('404 response when', () => {
    const expectedStatus = { status: 404 };

    test('form does not exist', async () => {
      readFormSpy.mockResolvedValue(null);

      const req = getMockReq({
        query: { formId },
      });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(readFormSpy).toBeCalledWith(formId);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Form not found',
        })
      );
    });

    test('readForm finds no active form (NotFoundError)', async () => {
      readFormSpy.mockRejectedValue(new NotFoundError({ modelClass: { name: 'Form' } }));

      const req = getMockReq({ query: { formId } });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining({ status: 404, detail: 'Form not found' }));
    });
  });

  describe('403 response when', () => {
    const expectedStatus = { status: 403 };

    test('form is not active', async () => {
      const mockForm = {
        id: formId,
        active: false,
        identityProviders: [{ code: 'public' }],
      };

      readFormSpy.mockResolvedValue(mockForm);

      const req = getMockReq({
        query: { formId },
      });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(readFormSpy).toBeCalledWith(formId);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Form is not active',
        })
      );
    });

    test('public user but form does not allow public access', async () => {
      const mockForm = {
        id: formId,
        active: true,
        identityProviders: [{ code: 'idir' }], // No public provider
      };

      readFormSpy.mockResolvedValue(mockForm);

      const req = getMockReq({
        currentUser: { username: 'public' }, // Public user, no idpUserId
        query: { formId },
      });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(readFormSpy).toBeCalledWith(formId);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Authentication required for file uploads on this form',
        })
      );
    });
  });

  describe('allows upload when', () => {
    test('authenticated user with idpUserId (skips form validation)', async () => {
      const req = getMockReq({
        currentUser: { idpUserId: 'some-id' }, // Has idpUserId
        query: { formId },
      });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      // Should skip form validation entirely
      expect(readFormSpy).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(); // Success - no error
    });

    test('public user on public form', async () => {
      const mockForm = {
        id: formId,
        active: true,
        identityProviders: [{ code: 'public' }],
      };

      readFormSpy.mockResolvedValue(mockForm);

      const req = getMockReq({
        currentUser: { username: 'public' }, // Public user, no idpUserId
        query: { formId },
      });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(readFormSpy).toBeCalledWith(formId);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(); // Success - no error
    });

    test('no currentUser (public access) on public form', async () => {
      const mockForm = {
        id: formId,
        active: true,
        identityProviders: [{ code: 'public' }],
      };

      readFormSpy.mockResolvedValue(mockForm);

      const req = getMockReq({
        // No currentUser at all
        query: { formId },
      });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(readFormSpy).toBeCalledWith(formId);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(); // Success - no error
    });

    test('form with multiple identity providers including public', async () => {
      const mockForm = {
        id: formId,
        active: true,
        identityProviders: [{ code: 'idir' }, { code: 'public' }, { code: 'bceid' }],
      };

      readFormSpy.mockResolvedValue(mockForm);

      const req = getMockReq({
        currentUser: { username: 'public' },
        query: { formId },
      });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(readFormSpy).toBeCalledWith(formId);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(); // Success - found public in the list
    });
  });

  describe('handles errors', () => {
    test('form service throws error', async () => {
      const error = new Error('Database connection failed');
      readFormSpy.mockRejectedValue(error);

      const req = getMockReq({
        query: { formId },
      });
      const { res, next } = getMockRes();

      await hasFileCreate(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining({ status: 500 }));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Unable to upload file at this time. Please try again later.',
        })
      );
    });
  });
});
