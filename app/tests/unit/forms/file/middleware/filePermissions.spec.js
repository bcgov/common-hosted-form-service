const Problem = require('api-problem');

const { currentFileRecord, hasFileCreate, hasFilePermissions } = require('../../../../../src/forms/file/middleware/filePermissions');
const service = require('../../../../../src/forms/file/service');
const userAccess = require('../../../../../src/forms/auth/middleware/userAccess');

const testRes = {
  writeHead: jest.fn(),
  end: jest.fn(),
};
const zeroUuid = '00000000-0000-0000-0000-000000000000';
const oneUuid = '11111111-1111-1111-1111-111111111111';

describe('currentFileRecord', () => {
  const readFileSpy = jest.spyOn(service, 'read');

  beforeEach(() => {
    readFileSpy.mockReset();
  });

  it('403s if there is no current user on the request scope', async () => {
    const testReq = {
      params: {
        id: zeroUuid,
      },
    };

    const nxt = jest.fn();

    await currentFileRecord(testReq, testRes, nxt);
    expect(testReq.currentFileRecord).toEqual(undefined);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(403, { detail: 'File access to this ID is unauthorized.' }));
    expect(readFileSpy).toHaveBeenCalledTimes(0);
  });

  it('403s if there is no file ID on the request scope', async () => {
    const testReq = {
      params: {},
      currentUser: {
        idpUserId: zeroUuid,
        username: 'jsmith@idir',
      },
    };

    const nxt = jest.fn();

    await currentFileRecord(testReq, testRes, nxt);
    expect(testReq.currentFileRecord).toEqual(undefined);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(403, { detail: 'File access to this ID is unauthorized.' }));
    expect(readFileSpy).toHaveBeenCalledTimes(0);
  });

  it('403s if there is no file record to be found', async () => {
    const testReq = {
      params: { id: zeroUuid },
      currentUser: {
        idpUserId: oneUuid,
        username: 'jsmith@idir',
      },
    };

    const nxt = jest.fn();
    readFileSpy.mockImplementation(() => {
      return undefined;
    });

    await currentFileRecord(testReq, testRes, nxt);
    expect(testReq.currentFileRecord).toEqual(undefined);
    expect(readFileSpy).toHaveBeenCalledTimes(1);
    expect(readFileSpy).toHaveBeenCalledWith(zeroUuid);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(403, { detail: 'File access to this ID is unauthorized.' }));
  });

  it('403s if an exception occurs from the file lookup', async () => {
    const testReq = {
      params: { id: zeroUuid },
      currentUser: {
        idpUserId: oneUuid,
        username: 'jsmith@idir',
      },
    };

    const nxt = jest.fn();
    readFileSpy.mockImplementation(() => {
      throw new Error();
    });

    await currentFileRecord(testReq, testRes, nxt);
    expect(testReq.currentFileRecord).toEqual(undefined);
    expect(readFileSpy).toHaveBeenCalledTimes(1);
    expect(readFileSpy).toHaveBeenCalledWith(zeroUuid);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(403, { detail: 'File access to this ID is unauthorized.' }));
  });

  it('403s if an exception occurs from the file lookup', async () => {
    const testReq = {
      params: { id: zeroUuid },
      currentUser: {
        idpUserId: oneUuid,
        username: 'jsmith@idir',
      },
    };
    const testRecord = {
      name: 'test',
    };

    const nxt = jest.fn();
    readFileSpy.mockImplementation(() => {
      return testRecord;
    });

    await currentFileRecord(testReq, testRes, nxt);
    expect(readFileSpy).toHaveBeenCalledTimes(1);
    expect(readFileSpy).toHaveBeenCalledWith(zeroUuid);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
    expect(testReq.currentFileRecord).toEqual(testRecord);
  });
});

describe('hasFileCreate', () => {
  it('403s if there is no current user on the request scope', async () => {
    const testReq = {
      headers: {
        authorization: 'Bearer hjvds0uds',
      },
    };

    const nxt = jest.fn();

    await hasFileCreate(testReq, testRes, nxt);
    expect(testReq.currentFileRecord).toEqual(undefined);
    expect(testReq.currentUser).toEqual(undefined);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(403, { detail: 'Invalid authorization credentials.' }));
  });

  it('403s if the current user is not an actual user (IE, public)', async () => {
    const testReq = {
      currentUser: {
        idpUserId: undefined,
        username: 'public',
      },
    };

    const nxt = jest.fn();

    await hasFileCreate(testReq, testRes, nxt);
    expect(testReq.currentFileRecord).toEqual(undefined);
    expect(testReq.currentUser).toEqual(testReq.currentUser);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(403, { detail: 'Invalid authorization credentials.' }));
  });

  it('passes if a authed user is on the request', async () => {
    const testReq = {
      currentUser: {
        idpUserId: zeroUuid,
        username: 'jsmith@idir',
      },
    };

    const nxt = jest.fn();

    await hasFileCreate(testReq, testRes, nxt);
    expect(testReq.currentFileRecord).toEqual(undefined);
    expect(testReq.currentUser).toEqual(testReq.currentUser);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });
});

describe('hasFilePermissions', () => {
  const perm = 'submission_read';

  const subPermSpy = jest.spyOn(userAccess, 'hasSubmissionPermissions');
  beforeEach(() => {
    subPermSpy.mockReset();
  });

  it('returns a middleware function', async () => {
    const mw = hasFilePermissions(perm);
    expect(mw).toBeInstanceOf(Function);
  });

  it('403s if the request has no current user', async () => {
    const mw = hasFilePermissions(perm);
    const nxt = jest.fn();
    const req = { a: '1' };

    mw(req, testRes, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(403, { detail: 'Unauthorized to read file' }));
  });

  it('403s if the request is a unauthed user', async () => {
    const mw = hasFilePermissions(perm);
    const nxt = jest.fn();
    const req = {
      currentUser: {
        idpUserId: undefined,
        username: 'public',
      },
    };

    mw(req, testRes, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(403, { detail: 'Unauthorized to read file' }));
  });

  it('passes through if the user is authed and the file record has no submission', async () => {
    const mw = hasFilePermissions(perm);
    const nxt = jest.fn();
    const req = {
      currentUser: {
        idpUserId: zeroUuid,
        username: 'jsmith@idir',
      },
      currentFileRecord: {
        name: 'unsubmitted file',
      },
    };

    mw(req, testRes, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });

  it('returns the result of the submission checking middleware', async () => {
    // Submission checking middleware is fully tested out in useraccess.spec.js
    // treat as black box for this testing
    subPermSpy.mockReturnValue(jest.fn());

    const mw = hasFilePermissions(perm);
    const nxt = jest.fn();
    const req = {
      query: {},
      currentUser: {
        idpUserId: zeroUuid,
        username: 'jsmith@idir',
      },
      currentFileRecord: {
        formSubmissionId: oneUuid,
        name: 'unsubmitted file',
      },
    };

    mw(req, testRes, nxt);
    expect(subPermSpy).toHaveBeenCalledTimes(1);
    expect(subPermSpy).toHaveBeenCalledWith(perm);
    expect(nxt).toHaveBeenCalledTimes(0);
  });
});
