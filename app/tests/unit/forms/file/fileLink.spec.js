const uuid = require('uuid');

jest.mock('../../../../src/components/log', () => {
  const log = { debug: jest.fn(), error: jest.fn(), info: jest.fn(), verbose: jest.fn(), warn: jest.fn() };
  return () => log;
});
const mockLog = require('../../../../src/components/log')();

const { FILE_LINK, FILE_LINK_REJECTED, decideFileLink, normalizeFileIds, planFileLinks } = require('../../../../src/forms/file/fileLink');
const { SystemUsers } = require('../../../../src/forms/common/constants');

const WORKER = SystemUsers.SUBMISSION_PACKAGE_WORKER;

const publicUser = { id: 'public', username: 'public', usernameIdp: 'public', public: true };
const idirUser = { id: uuid.v4(), idpUserId: uuid.v4(), usernameIdp: 'jdoe@idir' };
const otherIdirUser = { id: uuid.v4(), idpUserId: uuid.v4(), usernameIdp: 'asmith@idir' };
const embedUser = { id: uuid.v4(), usernameIdp: 'api-user' };

const submissionId = uuid.v4();
const pending = (createdBy, updatedBy) => ({ id: uuid.v4(), formSubmissionId: null, createdBy, updatedBy });

describe('decideFileLink', () => {
  test.each([
    ['a file already on this submission', { formSubmissionId: submissionId, createdBy: 'asmith@idir' }, idirUser, FILE_LINK.KEEP],
    ['a file on another submission, uploaded by the submitter', { formSubmissionId: uuid.v4(), createdBy: 'jdoe@idir' }, idirUser, FILE_LINK.LEAVE],
    ['a file on another submission, uploaded by someone else', { formSubmissionId: uuid.v4(), createdBy: 'asmith@idir' }, idirUser, FILE_LINK.LEAVE],
    ['a file on another submission, anonymous submitter', { formSubmissionId: uuid.v4(), createdBy: 'public' }, publicUser, FILE_LINK.LEAVE],
  ])('%s', (_name, row, user, expected) => {
    expect(decideFileLink({ file: { id: uuid.v4(), ...row }, submissionId, user })).toBe(expected);
  });

  test.each([
    ['the signed-in submitter', pending('jdoe@idir'), idirUser, FILE_LINK.LINK],
    ['another signed-in user', pending('asmith@idir'), idirUser, FILE_LINK.REJECT],
    ['an anonymous uploader, signed-in submitter', pending('public'), idirUser, FILE_LINK.REJECT],
    ['an anonymous uploader, anonymous or API key submitter', pending('public'), publicUser, FILE_LINK.LINK],
    ['an anonymous uploader, no user at all', pending('public'), undefined, FILE_LINK.LINK],
    ['a signed-in uploader, anonymous submitter', pending('jdoe@idir'), publicUser, FILE_LINK.REJECT],
    ['the embed user, embed submitter', pending('api-user'), embedUser, FILE_LINK.LINK],
    ['the embed user, signed-in submitter', pending('api-user'), otherIdirUser, FILE_LINK.REJECT],
    ['the package worker', pending(WORKER), publicUser, FILE_LINK.REJECT],
    ['a file the package worker moved', pending('public', WORKER), publicUser, FILE_LINK.REJECT],
    ['a row with no createdBy', pending(undefined), idirUser, FILE_LINK.REJECT],
  ])('a pending upload by %s', (_name, file, user, expected) => {
    expect(decideFileLink({ file, submissionId, user })).toBe(expected);
  });

  test('a package worker marker on an attached file is not checked', () => {
    const file = { id: uuid.v4(), formSubmissionId: submissionId, createdBy: WORKER, updatedBy: WORKER };

    expect(decideFileLink({ file, submissionId, user: publicUser })).toBe(FILE_LINK.KEEP);
  });
});

describe('planFileLinks', () => {
  test('returns the files to link and counts the ones left elsewhere', () => {
    const mine = pending('jdoe@idir');
    const kept = { id: uuid.v4(), formSubmissionId: submissionId, createdBy: 'jdoe@idir' };
    const elsewhere = { id: uuid.v4(), formSubmissionId: uuid.v4(), createdBy: 'jdoe@idir' };

    expect(planFileLinks({ files: [mine, kept, elsewhere], submissionId, user: idirUser })).toEqual({ link: [mine], left: 1 });
  });

  test('throws a 400 with a generic detail when any file is rejected, and logs why', () => {
    const theirs = pending('asmith@idir');
    mockLog.warn.mockClear();

    expect(() => planFileLinks({ files: [pending('jdoe@idir'), theirs], submissionId, user: idirUser })).toThrow(
      expect.objectContaining({ status: 400, detail: FILE_LINK_REJECTED })
    );
    expect(mockLog.warn).toHaveBeenCalledWith('Submission names a file it cannot attach', {
      submissionId,
      fileId: theirs.id,
      reason: 'uploader',
      createdBy: 'asmith@idir',
      submitter: 'jdoe@idir',
    });
  });

  test('logs a package as the reason for a rejected package file', () => {
    mockLog.warn.mockClear();

    expect(() => planFileLinks({ files: [pending('public', WORKER)], submissionId, user: undefined })).toThrow(expect.objectContaining({ status: 400 }));
    expect(mockLog.warn).toHaveBeenCalledWith('Submission names a file it cannot attach', expect.objectContaining({ reason: 'package', submitter: 'public' }));
  });

  test('returns nothing to do for no files', () => {
    expect(planFileLinks({ files: [], submissionId, user: idirUser })).toEqual({ link: [], left: 0 });
  });
});

describe('normalizeFileIds', () => {
  const id = '0b6a2b0c-1d4e-4f5a-8b6c-7d8e9f0a1b21';

  test('keeps UUID strings, lowercased, each once', () => {
    expect(normalizeFileIds([id, id.toUpperCase(), 'not-a-uuid', 42, null, undefined, { id }])).toEqual([id]);
  });

  test('drops forms of an id that are not standard UUID text', () => {
    expect(normalizeFileIds([`{${id}}`, id.replaceAll('-', '')])).toEqual([]);
  });

  test('returns nothing for no ids', () => {
    expect(normalizeFileIds([])).toEqual([]);
  });
});
