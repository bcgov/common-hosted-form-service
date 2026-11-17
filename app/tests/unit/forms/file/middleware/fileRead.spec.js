const { getMockReq, getMockRes } = require('@jest-mock/express');
const uuid = require('uuid');

const { FILE_READ, decideFileRead, hasFileRead } = require('../../../../../src/forms/file/middleware/filePermissions');
const service = require('../../../../../src/forms/file/service');
const userAccess = require('../../../../../src/forms/auth/middleware/userAccess');
const idpService = require('../../../../../src/components/idpService');
const { SystemUsers } = require('../../../../../src/forms/common/constants');

const PACKAGE_WORKER = SystemUsers.SUBMISSION_PACKAGE_WORKER;
const DENIED = { status: 403, detail: 'Unauthorized to read file.' };

const idir = { code: 'idir', tokenmap: { username: 'idir_username' }, extra: {} };
const bceidBasic = { code: 'bceid-basic', tokenmap: { username: 'bceid_username' }, extra: { restrictFileDownloads: true } };
const bceidBasicUnflagged = { code: 'bceid-basic', tokenmap: { username: 'bceid_username' }, extra: {} };
const bcsc = { code: 'bcservicescard', tokenmap: { username: 'anonymous::raw' }, extra: {} };
const noUsernameMapping = { code: 'other', tokenmap: { idpUserId: 'sub' }, extra: {} };
const publicIdp = { code: 'public', tokenmap: null, extra: null };

const publicUser = { id: 'public', username: 'public', usernameIdp: 'public', idp: 'public', public: true };
const idirUser = { id: uuid.v4(), idpUserId: uuid.v4(), usernameIdp: 'jdoe@idir', idp: 'idir' };
const otherIdirUser = { id: uuid.v4(), idpUserId: uuid.v4(), usernameIdp: 'asmith@idir', idp: 'idir' };
const basicUser = { id: uuid.v4(), idpUserId: uuid.v4(), usernameIdp: 'bob@bceid-basic', idp: 'bceid-basic' };
const bcscUser = { id: uuid.v4(), idpUserId: uuid.v4(), usernameIdp: 'anonymous@bcservicescard', idp: 'bcservicescard' };
const otherUser = { id: uuid.v4(), idpUserId: uuid.v4(), usernameIdp: 'public@other', idp: 'other' };

const attached = (createdBy = 'public') => ({ id: uuid.v4(), formSubmissionId: uuid.v4(), createdBy });
const unattached = (createdBy, updatedBy) => ({ id: uuid.v4(), formSubmissionId: null, createdBy, updatedBy });

describe('decideFileRead', () => {
  describe('attached file', () => {
    test.each([
      ['an API key caller', { apiUser: true, user: publicUser, idp: publicIdp }, FILE_READ.ALLOW],
      ['the public user', { apiUser: false, user: publicUser, idp: publicIdp }, FILE_READ.DENY],
      ['no user at all', { apiUser: false, user: undefined, idp: undefined }, FILE_READ.DENY],
      ['a Basic BCeID user', { apiUser: false, user: basicUser, idp: bceidBasic }, FILE_READ.DENY],
      ['a bceid-basic user whose provider lacks the flag', { apiUser: false, user: basicUser, idp: bceidBasicUnflagged }, FILE_READ.SUBMISSION],
      ['a signed-in user whose provider was not found', { apiUser: false, user: idirUser, idp: undefined }, FILE_READ.DENY],
      ['an IDIR user', { apiUser: false, user: idirUser, idp: idir }, FILE_READ.SUBMISSION],
      ['a BC Services Card user', { apiUser: false, user: bcscUser, idp: bcsc }, FILE_READ.SUBMISSION],
    ])('%s', (_name, caller, expected) => {
      expect(decideFileRead({ file: attached(), ...caller })).toBe(expected);
    });

    test('a Basic BCeID user on their own submission', () => {
      const file = attached(basicUser.usernameIdp);

      expect(decideFileRead({ file, apiUser: false, user: basicUser, idp: bceidBasic })).toBe(FILE_READ.DENY);
    });

    test('a requested submission id that is not the file submission', () => {
      const file = attached();

      expect(decideFileRead({ file, apiUser: false, user: idirUser, idp: idir, requestedSubmissionId: uuid.v4() })).toBe(FILE_READ.DENY);
      expect(decideFileRead({ file, apiUser: true, user: publicUser, idp: publicIdp, requestedSubmissionId: uuid.v4() })).toBe(FILE_READ.DENY);
      expect(decideFileRead({ file, apiUser: false, user: idirUser, idp: idir, requestedSubmissionId: [file.formSubmissionId, uuid.v4()] })).toBe(FILE_READ.DENY);
    });

    test('a requested submission id that is the file submission', () => {
      const file = attached();

      expect(decideFileRead({ file, apiUser: false, user: idirUser, idp: idir, requestedSubmissionId: file.formSubmissionId })).toBe(FILE_READ.SUBMISSION);
    });

    test('a package marker is not trusted for attached files', () => {
      const file = { ...attached(), updatedBy: PACKAGE_WORKER };

      expect(decideFileRead({ file, apiUser: false, user: publicUser, idp: publicIdp })).toBe(FILE_READ.DENY);
    });
  });

  describe('unattached file', () => {
    test.each([
      ['package file, public user', unattached('public', PACKAGE_WORKER), { apiUser: false, user: publicUser, idp: publicIdp }, FILE_READ.PACKAGE],
      ['package file, Basic BCeID user', unattached('public', PACKAGE_WORKER), { apiUser: false, user: basicUser, idp: bceidBasic }, FILE_READ.PACKAGE],
      ['package file, API key caller', unattached('public', PACKAGE_WORKER), { apiUser: true, user: publicUser, idp: publicIdp }, FILE_READ.PACKAGE],
      ['public upload, public user', unattached('public'), { apiUser: false, user: publicUser, idp: publicIdp }, FILE_READ.DENY],
      ['public upload, API key caller', unattached('public'), { apiUser: true, user: publicUser, idp: publicIdp }, FILE_READ.DENY],
      ['public upload, IDIR user', unattached('public'), { apiUser: false, user: idirUser, idp: idir }, FILE_READ.DENY],
      ['IDIR upload, its creator', unattached(idirUser.usernameIdp), { apiUser: false, user: idirUser, idp: idir }, FILE_READ.ALLOW],
      ['IDIR upload, its creator with no provider row', unattached(idirUser.usernameIdp), { apiUser: false, user: idirUser, idp: undefined }, FILE_READ.DENY],
      ['IDIR upload, another IDIR user', unattached(idirUser.usernameIdp), { apiUser: false, user: otherIdirUser, idp: idir }, FILE_READ.DENY],
      ['IDIR upload, API key caller', unattached(idirUser.usernameIdp), { apiUser: true, user: publicUser, idp: publicIdp }, FILE_READ.DENY],
      ['Basic BCeID upload, its creator', unattached(basicUser.usernameIdp), { apiUser: false, user: basicUser, idp: bceidBasic }, FILE_READ.DENY],
      ['BC Services Card upload, a BC Services Card user', unattached(bcscUser.usernameIdp), { apiUser: false, user: bcscUser, idp: bcsc }, FILE_READ.DENY],
      ['upload from a provider with no username mapping', unattached(otherUser.usernameIdp), { apiUser: false, user: otherUser, idp: noUsernameMapping }, FILE_READ.DENY],
      ['row with no createdBy, user with no usernameIdp', unattached(undefined), { apiUser: false, user: { idpUserId: uuid.v4(), idp: 'idir' }, idp: idir }, FILE_READ.DENY],
    ])('%s', (_name, file, caller, expected) => {
      expect(decideFileRead({ file, ...caller })).toBe(expected);
    });

    test('a requested submission id on an unattached file', () => {
      const file = unattached(idirUser.usernameIdp);

      expect(decideFileRead({ file, apiUser: false, user: idirUser, idp: idir, requestedSubmissionId: uuid.v4() })).toBe(FILE_READ.DENY);
    });
  });
});

describe('hasFileRead', () => {
  let findByCodeSpy;
  let isPackageFileSpy;
  let submissionPermissionsSpy;

  beforeEach(() => {
    findByCodeSpy = jest.spyOn(idpService, 'findByCode');
    isPackageFileSpy = jest.spyOn(service, 'isPackageFile');
    submissionPermissionsSpy = jest.spyOn(userAccess, 'hasSubmissionPermissions');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('allows the creator of an unattached upload', async () => {
    findByCodeSpy.mockResolvedValue(idir);
    const req = getMockReq({ currentUser: idirUser, currentFileRecord: unattached(idirUser.usernameIdp) });
    const { res, next } = getMockRes();

    await hasFileRead(req, res, next);

    expect(findByCodeSpy).toBeCalledWith('idir');
    expect(next).toBeCalledWith();
  });

  test('denies a Basic BCeID user with a 403', async () => {
    findByCodeSpy.mockResolvedValue(bceidBasic);
    const req = getMockReq({ currentUser: basicUser, currentFileRecord: attached() });
    const { res, next } = getMockRes();

    await hasFileRead(req, res, next);

    expect(submissionPermissionsSpy).not.toBeCalled();
    expect(next).toBeCalledWith(expect.objectContaining(DENIED));
  });

  test('denies a formSubmissionId query that is not the file submission', async () => {
    findByCodeSpy.mockResolvedValue(idir);
    const req = getMockReq({ currentUser: idirUser, currentFileRecord: attached(), query: { formSubmissionId: uuid.v4() } });
    const { res, next } = getMockRes();

    await hasFileRead(req, res, next);

    expect(submissionPermissionsSpy).not.toBeCalled();
    expect(next).toBeCalledWith(expect.objectContaining(DENIED));
  });

  test('allows a package file that a package job references', async () => {
    findByCodeSpy.mockResolvedValue(publicIdp);
    isPackageFileSpy.mockResolvedValue(true);
    const file = unattached('public', PACKAGE_WORKER);
    const req = getMockReq({ currentUser: publicUser, currentFileRecord: file });
    const { res, next } = getMockRes();

    await hasFileRead(req, res, next);

    expect(isPackageFileSpy).toBeCalledWith(file.id);
    expect(next).toBeCalledWith();
  });

  test('denies a package marker that no package job references', async () => {
    findByCodeSpy.mockResolvedValue(publicIdp);
    isPackageFileSpy.mockResolvedValue(false);
    const req = getMockReq({ currentUser: publicUser, currentFileRecord: unattached('public', PACKAGE_WORKER) });
    const { res, next } = getMockRes();

    await hasFileRead(req, res, next);

    expect(next).toBeCalledWith(expect.objectContaining(DENIED));
  });

  test('passes on a package job lookup error', async () => {
    const error = new Error('lookup failed');
    findByCodeSpy.mockResolvedValue(publicIdp);
    isPackageFileSpy.mockRejectedValue(error);
    const req = getMockReq({ currentUser: publicUser, currentFileRecord: unattached('public', PACKAGE_WORKER) });
    const { res, next } = getMockRes();

    await hasFileRead(req, res, next);

    expect(next).toBeCalledWith(error);
  });

  test('hands attached files for other signed-in users to the submission check', async () => {
    findByCodeSpy.mockResolvedValue(idir);
    const submissionCheck = jest.fn((_req, _res, next) => next());
    submissionPermissionsSpy.mockReturnValue(submissionCheck);
    const req = getMockReq({ currentUser: idirUser, currentFileRecord: attached() });
    const { res, next } = getMockRes();

    await hasFileRead(req, res, next);

    expect(submissionPermissionsSpy).toBeCalledWith(['submission_read']);
    expect(submissionCheck).toBeCalledWith(req, res, next);
    expect(next).toBeCalledWith();
  });

  test('does not look up the package job for other unattached rows', async () => {
    findByCodeSpy.mockResolvedValue(publicIdp);
    const req = getMockReq({ currentUser: publicUser, currentFileRecord: unattached('public') });
    const { res, next } = getMockRes();

    await hasFileRead(req, res, next);

    expect(isPackageFileSpy).not.toBeCalled();
    expect(next).toBeCalledWith(expect.objectContaining(DENIED));
  });

  test('denies without a provider lookup when the user has no identity provider', async () => {
    const req = getMockReq({ currentUser: { idpUserId: uuid.v4(), usernameIdp: 'jdoe@idir' }, currentFileRecord: unattached('jdoe@idir') });
    const { res, next } = getMockRes();

    await hasFileRead(req, res, next);

    expect(findByCodeSpy).not.toBeCalled();
    expect(next).toBeCalledWith(expect.objectContaining(DENIED));
  });

  test('passes on an identity provider lookup error', async () => {
    const error = new Error('lookup failed');
    findByCodeSpy.mockRejectedValue(error);
    const req = getMockReq({ currentUser: basicUser, currentFileRecord: attached() });
    const { res, next } = getMockRes();

    await hasFileRead(req, res, next);

    expect(next).toBeCalledWith(error);
  });
});
