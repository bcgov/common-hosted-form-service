const { getMockReq, getMockRes } = require('@jest-mock/express');
const uuid = require('uuid');

const { currentFileRecord, hasFileCreate, hasFileDelete, hasFilePermissions } = require('../../../../../src/forms/file/middleware/filePermissions');
const service = require('../../../../../src/forms/file/service');
const userAccess = require('../../../../../src/forms/auth/middleware/userAccess');

const fileId = uuid.v4();
const formSubmissionId = uuid.v4();
const idpUserId = uuid.v4();

const bearerToken = Math.random().toString(36).substring(2);

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

// External dependencies used by the implementation are: none
//
describe('hasFileCreate', () => {
  describe('403 response when', () => {
    const expectedStatus = { status: 403 };

    test('there is no current user on the request scope', () => {
      const req = getMockReq({
        headers: {
          authorization: 'Bearer ' + bearerToken,
        },
      });
      const { res, next } = getMockRes();

      hasFileCreate(req, res, next);

      expect(req.currentFileRecord).toEqual(undefined);
      expect(req.currentUser).toEqual(undefined);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Invalid authorization credentials.',
        })
      );
    });

    test('the current user is a public user', () => {
      const req = getMockReq({
        currentUser: {
          username: 'public',
        },
      });
      const { res, next } = getMockRes();

      hasFileCreate(req, res, next);

      expect(req.currentFileRecord).toEqual(undefined);
      expect(req.currentUser).toEqual(req.currentUser);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Invalid authorization credentials.',
        })
      );
    });
  });

  describe('allows', () => {
    test('an idp user on the request', async () => {
      const req = getMockReq({
        currentUser: currentUserIdp,
      });
      const { res, next } = getMockRes();

      hasFileCreate(req, res, next);

      expect(req.currentFileRecord).toEqual(undefined);
      expect(req.currentUser).toEqual(currentUserIdp);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });
  });
});

// External dependencies used by the implementation are: none
//
describe('hasFileDelete', () => {
  const readFileSpy = jest.spyOn(service, 'read');
  const submissionPermissionsSpy = jest.spyOn(userAccess, 'hasSubmissionPermissions');

  beforeEach(() => {
    readFileSpy.mockReset();
    submissionPermissionsSpy.mockReset();
  });

  describe('403 response when', () => {
    const expectedStatus = { status: 403 };

    test('there is no current user on the request scope', () => {
      const req = getMockReq({
        headers: {
          authorization: 'Bearer ' + bearerToken,
        },
      });
      const { res, next } = getMockRes();

      hasFileDelete(req, res, next);

      expect(req.currentFileRecord).toEqual(undefined);
      expect(req.currentUser).toEqual(undefined);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Invalid authorization credentials.',
        })
      );
    });

    test('the current user is a public user', () => {
      const req = getMockReq({
        currentUser: {
          username: 'public',
        },
      });
      const { res, next } = getMockRes();

      hasFileDelete(req, res, next);

      expect(req.currentFileRecord).toEqual(undefined);
      expect(req.currentUser).toEqual(req.currentUser);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Invalid authorization credentials.',
        })
      );
    });

    test('the fileIds are not an array', () => {
      const req = getMockReq({
        currentUser: currentUserIdp,
        body: {
          fileIds: 'string',
        },
      });
      const { res, next } = getMockRes();

      hasFileDelete(req, res, next);

      expect(req.currentFileRecord).toEqual(undefined);
      expect(req.currentUser).toEqual(currentUserIdp);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'File IDs must be an array of file UUIDs.',
        })
      );
    });

    test('the file is not found', () => {
      readFileSpy.mockImplementation(() => {
        return Promise.resolve(undefined);
      });
      const req = getMockReq({
        currentUser: currentUserIdp,
        body: {
          fileIds: [fileId],
        },
      });
      const { res, next } = getMockRes();

      hasFileDelete(req, res, next).then(() => {
        expect(req.currentFileRecord).toEqual(undefined);
        expect(req.currentUser).toEqual(currentUserIdp);
        expect(next).toBeCalledTimes(1); // for some reason this is called 0 times?
        expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
        expect(next).toBeCalledWith(
          expect.objectContaining({
            detail: 'File access to this ID is unauthorized.',
          })
        );
      });
    });

    test('hasSubmissionPermissions returns an error', (done) => {
      const error = new Error('Permission error');
      readFileSpy.mockResolvedValue({
        id: fileId,
        formSubmissionId: '123',
      });
      const mockSubPermCheck = async (_req, _res, next) => {
        next(error);
      };
      submissionPermissionsSpy.mockImplementation(() => mockSubPermCheck);

      const req = getMockReq({
        currentUser: currentUserIdp,
        body: {
          fileIds: [fileId],
        },
      });
      const { res, next } = getMockRes();

      hasFileDelete(req, res, next)
        .then(() => {
          expect(req.currentFileRecord).toEqual({
            id: fileId,
            formSubmissionId: '123',
          });
          expect(req.currentUser).toEqual(currentUserIdp);
          expect(next).toBeCalledTimes(1);
          expect(next).toBeCalledWith(error);
          done();
        })
        .catch(done);
    });
  });

  describe('allows', () => {
    test('an idp user on the request', (done) => {
      readFileSpy.mockResolvedValue({
        id: fileId,
        formSubmissionId: '123',
      });
      const mockSubPermCheck = async (_req, _res, next) => {
        next();
      };
      submissionPermissionsSpy.mockImplementation(() => mockSubPermCheck);

      const req = getMockReq({
        currentUser: currentUserIdp,
        body: {
          fileIds: [fileId],
        },
      });
      const { res, next } = getMockRes();

      hasFileDelete(req, res, next)
        .then(() => {
          expect(req.currentFileRecord).toEqual({
            id: fileId,
            formSubmissionId: '123',
          });
          expect(req.currentUser).toEqual(currentUserIdp);
          expect(next).toBeCalledTimes(1);
          done();
        })
        .catch(done);
    });
  });
});

describe('hasFilePermissions', () => {
  const permissions = ['submission_read'];

  const submissionPermissionsSpy = jest.spyOn(userAccess, 'hasSubmissionPermissions');
  beforeEach(() => {
    submissionPermissionsSpy.mockReset();
  });

  it('returns a middleware function', async () => {
    const middleware = hasFilePermissions(permissions);

    expect(middleware).toBeInstanceOf(Function);
  });

  describe('403 response when', () => {
    const expectedStatus = { status: 403 };

    test('the request has no current user', async () => {
      const req = getMockReq();
      const { res, next } = getMockRes();

      hasFilePermissions(permissions)(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Unauthorized to read file.',
        })
      );
    });

    test('the current user is a public user', async () => {
      const req = getMockReq({
        currentUser: {
          username: 'public',
        },
      });
      const { res, next } = getMockRes();

      hasFilePermissions(permissions)(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toBeCalledWith(
        expect.objectContaining({
          detail: 'Unauthorized to read file.',
        })
      );
    });
  });

  describe('allows', () => {
    test('an api key user on the request', async () => {
      const req = getMockReq({
        apiUser: true,
        currentFileRecord: {
          formSubmissionId: formSubmissionId,
        },
      });
      const { res, next } = getMockRes();

      hasFilePermissions(permissions)(req, res, next);

      expect(submissionPermissionsSpy).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('authed user when file record has submission', async () => {
      submissionPermissionsSpy.mockReturnValue(jest.fn());
      const req = getMockReq({
        query: {},
        currentFileRecord: {
          formSubmissionId: formSubmissionId,
          name: 'unsubmitted file',
        },
        currentUser: currentUserIdp,
      });
      const { res, next } = getMockRes();

      hasFilePermissions(permissions)(req, res, next);

      expect(submissionPermissionsSpy).toBeCalledTimes(1);
      expect(submissionPermissionsSpy).toBeCalledWith(permissions);
      expect(next).toBeCalledTimes(0);
    });

    test('authed user when file record has no submission', async () => {
      const req = getMockReq({
        currentFileRecord: {
          name: 'unsubmitted file',
        },
        currentUser: currentUserIdp,
      });
      const { res, next } = getMockRes();

      hasFilePermissions(permissions)(req, res, next);

      expect(submissionPermissionsSpy).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });
  });
});
