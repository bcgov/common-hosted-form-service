const { getMockReq, getMockRes } = require('@jest-mock/express');
const uuid = require('uuid');

const { FILE_DELETE, decideFileDelete, hasFileDelete } = require('../../../../../src/forms/file/middleware/filePermissions');
const userAccess = require('../../../../../src/forms/auth/middleware/userAccess');
const { SystemUsers } = require('../../../../../src/forms/common/constants');

const PACKAGE_WORKER = SystemUsers.SUBMISSION_PACKAGE_WORKER;
const DENIED = { status: 403, detail: 'Unauthorized to delete file.' };

const publicUser = { id: 'public', username: 'public', usernameIdp: 'public', idp: 'public', public: true };
const idirUser = { id: uuid.v4(), idpUserId: uuid.v4(), usernameIdp: 'jdoe@idir', idp: 'idir' };
const otherIdirUser = { id: uuid.v4(), idpUserId: uuid.v4(), usernameIdp: 'asmith@idir', idp: 'idir' };
const basicUser = { id: uuid.v4(), idpUserId: uuid.v4(), usernameIdp: 'bob@bceid-basic', idp: 'bceid-basic' };
const bcscUser = { id: uuid.v4(), idpUserId: uuid.v4(), usernameIdp: 'anonymous@bcservicescard', idp: 'bcservicescard' };
const otherBcscUser = { id: uuid.v4(), idpUserId: uuid.v4(), usernameIdp: 'anonymous@bcservicescard', idp: 'bcservicescard' };

const attached = (createdBy = 'public') => ({ id: uuid.v4(), formSubmissionId: uuid.v4(), createdBy });
const unattached = (createdBy, updatedBy) => ({ id: uuid.v4(), formSubmissionId: null, createdBy, updatedBy });

describe('decideFileDelete', () => {
  describe('attached file', () => {
    test.each([
      ['an API key caller', { apiUser: true, user: publicUser }, FILE_DELETE.ALLOW],
      ['the public user', { apiUser: false, user: publicUser }, FILE_DELETE.DENY],
      ['no user at all', { apiUser: false, user: undefined }, FILE_DELETE.DENY],
      ['an IDIR user', { apiUser: false, user: idirUser }, FILE_DELETE.SUBMISSION],
      ['a Basic BCeID user', { apiUser: false, user: basicUser }, FILE_DELETE.SUBMISSION],
      ['a BC Services Card user', { apiUser: false, user: bcscUser }, FILE_DELETE.SUBMISSION],
    ])('%s', (_name, caller, expected) => {
      expect(decideFileDelete({ file: attached(), ...caller })).toBe(expected);
    });

    test('the uploader is checked against the submission, not createdBy', () => {
      const file = attached(idirUser.usernameIdp);

      expect(decideFileDelete({ file, apiUser: false, user: idirUser })).toBe(FILE_DELETE.SUBMISSION);
    });

    test('a requested submission id that is not the file submission', () => {
      const file = attached();

      expect(decideFileDelete({ file, apiUser: false, user: idirUser, requestedSubmissionId: uuid.v4() })).toBe(FILE_DELETE.DENY);
      expect(decideFileDelete({ file, apiUser: true, user: publicUser, requestedSubmissionId: uuid.v4() })).toBe(FILE_DELETE.DENY);
      expect(decideFileDelete({ file, apiUser: false, user: idirUser, requestedSubmissionId: [file.formSubmissionId, uuid.v4()] })).toBe(FILE_DELETE.DENY);
    });

    test('a requested submission id that is the file submission', () => {
      const file = attached();

      expect(decideFileDelete({ file, apiUser: false, user: idirUser, requestedSubmissionId: file.formSubmissionId })).toBe(FILE_DELETE.SUBMISSION);
    });
  });

  describe('unattached file', () => {
    test.each([
      ['package file, its job worker cannot be impersonated', unattached('public', PACKAGE_WORKER), { apiUser: false, user: publicUser }, FILE_DELETE.DENY],
      ['package file, an IDIR user', unattached('public', PACKAGE_WORKER), { apiUser: false, user: idirUser }, FILE_DELETE.DENY],
      ['package file, an API key caller', unattached('public', PACKAGE_WORKER), { apiUser: true, user: publicUser }, FILE_DELETE.DENY],
      ['webcomponents API upload', unattached('api-user'), { apiUser: false, user: publicUser }, FILE_DELETE.DENY],
      ['webcomponents gateway upload', unattached('gateway-user'), { apiUser: false, user: idirUser }, FILE_DELETE.DENY],
      ['webcomponents anonymous upload, the public user', unattached('public-user'), { apiUser: false, user: publicUser }, FILE_DELETE.DENY],
      ['webcomponents anonymous upload, an IDIR user', unattached('public-user'), { apiUser: false, user: idirUser }, FILE_DELETE.DENY],
      ['public upload, an API key caller', unattached('public'), { apiUser: true, user: publicUser }, FILE_DELETE.DENY],
      ['public upload, the public user', unattached('public'), { apiUser: false, user: publicUser }, FILE_DELETE.ALLOW],
      ['public upload, no user at all', unattached('public'), { apiUser: false, user: undefined }, FILE_DELETE.ALLOW],
      ['public upload, an IDIR user', unattached('public'), { apiUser: false, user: idirUser }, FILE_DELETE.ALLOW],
      ['IDIR upload, its creator', unattached(idirUser.usernameIdp), { apiUser: false, user: idirUser }, FILE_DELETE.ALLOW],
      ['IDIR upload, another IDIR user', unattached(idirUser.usernameIdp), { apiUser: false, user: otherIdirUser }, FILE_DELETE.DENY],
      ['IDIR upload, the public user', unattached(idirUser.usernameIdp), { apiUser: false, user: publicUser }, FILE_DELETE.DENY],
      ['IDIR upload, an API key caller', unattached(idirUser.usernameIdp), { apiUser: true, user: publicUser }, FILE_DELETE.DENY],
      ['Basic BCeID upload, its creator', unattached(basicUser.usernameIdp), { apiUser: false, user: basicUser }, FILE_DELETE.ALLOW],
      ['BC Services Card upload, its creator', unattached(bcscUser.usernameIdp), { apiUser: false, user: bcscUser }, FILE_DELETE.ALLOW],
      ['BC Services Card upload, another BC Services Card user', unattached(bcscUser.usernameIdp), { apiUser: false, user: otherBcscUser }, FILE_DELETE.ALLOW],
      ['row with no createdBy, user with no usernameIdp', unattached(undefined), { apiUser: false, user: { idpUserId: uuid.v4(), idp: 'idir' } }, FILE_DELETE.DENY],
      ['createdBy "public@idir" is not an anonymous upload', unattached('public@idir'), { apiUser: false, user: publicUser }, FILE_DELETE.DENY],
    ])('%s', (_name, file, caller, expected) => {
      expect(decideFileDelete({ file, ...caller })).toBe(expected);
    });

    test('a requested submission id on an unattached file', () => {
      const file = unattached('public');

      expect(decideFileDelete({ file, apiUser: false, user: publicUser, requestedSubmissionId: uuid.v4() })).toBe(FILE_DELETE.DENY);
    });
  });
});

describe('hasFileDelete', () => {
  let submissionPermissionsSpy;

  beforeEach(() => {
    submissionPermissionsSpy = jest.spyOn(userAccess, 'hasSubmissionPermissions');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('allows the creator of an unattached upload', async () => {
    const req = getMockReq({ currentUser: idirUser, currentFileRecord: unattached(idirUser.usernameIdp) });
    const { res, next } = getMockRes();

    await hasFileDelete(req, res, next);

    expect(submissionPermissionsSpy).not.toBeCalled();
    expect(next).toBeCalledWith();
  });

  test('denies another user with a 403', async () => {
    const req = getMockReq({ currentUser: otherIdirUser, currentFileRecord: unattached(idirUser.usernameIdp) });
    const { res, next } = getMockRes();

    await hasFileDelete(req, res, next);

    expect(next).toBeCalledWith(expect.objectContaining(DENIED));
  });

  test('denies a formSubmissionId query that is not the file submission', async () => {
    const req = getMockReq({ currentUser: idirUser, currentFileRecord: attached(), query: { formSubmissionId: uuid.v4() } });
    const { res, next } = getMockRes();

    await hasFileDelete(req, res, next);

    expect(submissionPermissionsSpy).not.toBeCalled();
    expect(next).toBeCalledWith(expect.objectContaining(DENIED));
  });

  test('hands attached files for signed-in users to the submission update check', async () => {
    const submissionCheck = jest.fn((_req, _res, next) => next());
    submissionPermissionsSpy.mockReturnValue(submissionCheck);
    const req = getMockReq({ currentUser: idirUser, currentFileRecord: attached() });
    const { res, next } = getMockRes();

    await hasFileDelete(req, res, next);

    expect(submissionPermissionsSpy).toBeCalledWith(['submission_update']);
    expect(submissionCheck).toBeCalledWith(req, res, next);
    expect(next).toBeCalledWith();
  });

  test('passes on an error when there is no file record', async () => {
    const req = getMockReq({ currentUser: idirUser });
    const { res, next } = getMockRes();

    await hasFileDelete(req, res, next);

    expect(next).toBeCalledWith(expect.any(TypeError));
  });
});
