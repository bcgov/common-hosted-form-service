const { Readable } = require('node:stream');
const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../common/helper');

//
// File reads through the real router and middleware chain: currentUser,
// basicApiAccess, currentFileRecord, hasFileRead and hasSubmissionPermissions
// all run for real. Only I/O edges are stubbed: JWT signature verification,
// the identity provider list, the user upsert and login history, the
// submission and form permission queries, file and package job lookups, the
// form API key lookup, and the object store.
//
const authService = require('../../../../src/forms/auth/service');
const formService = require('../../../../src/forms/form/service');
const submissionService = require('../../../../src/forms/submission/service');
const fileService = require('../../../../src/forms/file/service');
const storageService = require('../../../../src/forms/file/storage/storageService');
const idpService = require('../../../../src/components/idpService');
const jwtService = require('../../../../src/components/jwtService');
const { SystemUsers } = require('../../../../src/forms/common/constants');

const router = require('../../../../src/forms/file/routes');

const basePath = '/files';
const appRequest = request(expressHelper(basePath, router));

const GATE_DENIED = 'Unauthorized to read file.';
const NOT_FOUND = 'File access to this ID is unauthorized.';
const NO_SUBMISSION_ACCESS = 'You do not have access to this submission.';

const PROVIDERS = [
  { code: 'public', idp: 'public', active: true, login: false, tokenmap: null, extra: {} },
  {
    code: 'idir',
    idp: 'idir',
    active: true,
    login: true,
    tokenmap: { idpUserId: 'idir_user_guid', keycloakId: 'idir_user_guid', username: 'idir_username', fullName: 'name', email: 'email', idp: 'identity_provider' },
    extra: {},
  },
  {
    code: 'bceid-basic',
    idp: 'bceidbasic',
    active: true,
    login: true,
    tokenmap: { idpUserId: 'bceid_user_guid', keycloakId: 'bceid_user_guid', username: 'bceid_username', fullName: 'name', email: 'email', idp: 'identity_provider' },
    extra: { restrictFileDownloads: true },
  },
  {
    code: 'bcservicescard',
    idp: 'bcsc-hint',
    active: true,
    login: true,
    tokenmap: { idpUserId: 'sub', keycloakId: 'sub', username: 'anonymous::raw', fullName: 'anonymous::raw', idp: 'identity_provider' },
    extra: {},
  },
];

// Bearer token -> verified JWT payload.
const TOKENS = {
  'idir-jdoe': { identity_provider: 'idir', idir_user_guid: uuid.v4(), idir_username: 'jdoe', name: 'J Doe', email: 'jdoe@example.com' },
  'idir-asmith': { identity_provider: 'idir', idir_user_guid: uuid.v4(), idir_username: 'asmith', name: 'A Smith', email: 'asmith@example.com' },
  'idir-reviewer': { identity_provider: 'idir', idir_user_guid: uuid.v4(), idir_username: 'reviewer', name: 'Reviewer', email: 'rev@example.com' },
  'basic-bob': { identity_provider: 'bceidbasic', bceid_user_guid: uuid.v4(), bceid_username: 'bob', name: 'Bob', email: 'bob@example.com' },
  'bcsc-one': { identity_provider: 'bcsc-hint', sub: uuid.v4() },
  'bcsc-two': { identity_provider: 'bcsc-hint', sub: uuid.v4() },
};

// Stable user ids per token, so submission-level permissions can key on them.
const USER_IDS = Object.fromEntries(Object.keys(TOKENS).map((t) => [t, uuid.v4()]));
const userIdFor = (userInfo) => {
  const entry = Object.entries(TOKENS).find(([, p]) => (p.idir_user_guid || p.bceid_user_guid || p.sub) === userInfo.idpUserId);
  return entry ? USER_IDS[entry[0]] : uuid.v4();
};

const forms = {
  login: { id: uuid.v4(), identityProviders: [{ code: 'idir' }], enableSubmissionUrlSharing: true },
  publicShared: { id: uuid.v4(), identityProviders: [{ code: 'public' }], enableSubmissionUrlSharing: true },
  publicPrivate: { id: uuid.v4(), identityProviders: [{ code: 'public' }], enableSubmissionUrlSharing: false },
};

const submissions = {
  login: { id: uuid.v4(), form: forms.login, deleted: false },
  loginDeleted: { id: uuid.v4(), form: forms.login, deleted: true },
  publicShared: { id: uuid.v4(), form: forms.publicShared, deleted: false },
  publicPrivate: { id: uuid.v4(), form: forms.publicPrivate, deleted: false },
};

// Team roles: the reviewer has submission_read on the login form.
const TEAM = { [`${USER_IDS['idir-reviewer']}|${forms.login.id}`]: ['form_read', 'submission_read'] };
// Submission users: jdoe submitted the login form submission.
const SUBMISSION_USERS = { [`${USER_IDS['idir-jdoe']}|${submissions.login.id}`]: ['submission_create', 'submission_read'] };

const formApiSecret = uuid.v4();
const basicAuthFor = (formId) => `Basic ${Buffer.from(`${formId}:${formApiSecret}`).toString('base64')}`;

const row = (overrides) => ({
  id: uuid.v4(),
  originalName: 'a.txt',
  mimeType: 'text/plain',
  size: 10,
  storage: 'localStorage',
  path: '/tmp/none',
  createdBy: 'public',
  updatedBy: null,
  formSubmissionId: null,
  updatedAt: new Date().toUTCString(),
  ...overrides,
});

const FILES = {
  publicUpload: row({}),
  packageFile: row({ updatedBy: SystemUsers.SUBMISSION_PACKAGE_WORKER }),
  strayMarker: row({ updatedBy: SystemUsers.SUBMISSION_PACKAGE_WORKER }),
  jdoeUpload: row({ createdBy: 'jdoe@idir' }),
  bobUpload: row({ createdBy: 'bob@bceid-basic' }),
  bcscUpload: row({ createdBy: 'anonymous@bcservicescard' }),
  login: row({ formSubmissionId: submissions.login.id }),
  loginDeleted: row({ formSubmissionId: submissions.loginDeleted.id }),
  publicShared: row({ formSubmissionId: submissions.publicShared.id }),
  publicPrivate: row({ formSubmissionId: submissions.publicPrivate.id }),
};

const findSubmission = (id) => Object.values(submissions).find((s) => s.id === id);

beforeEach(() => {
  jest.spyOn(idpService, 'getIdentityProviders').mockResolvedValue(PROVIDERS);
  jest.spyOn(jwtService, '_verify').mockImplementation(async (token) => {
    if (!TOKENS[token]) throw new Error('unexpected token');
    return TOKENS[token];
  });
  jest.spyOn(authService, 'getUserId').mockImplementation(async (userInfo) => (userInfo.public ? { id: 'public', ...userInfo } : { id: userIdFor(userInfo), ...userInfo }));
  jest.spyOn(authService, 'recordLoginHistory').mockResolvedValue();
  jest.spyOn(authService, 'getSubmissionForm').mockImplementation(async (id) => {
    const s = findSubmission(id);
    if (!s) throw new Error('NotFoundError');
    return { submission: { submissionId: s.id, formId: s.form.id, deleted: s.deleted }, form: s.form };
  });
  jest.spyOn(authService, 'getUserForms').mockImplementation(async (user, params) => {
    const permissions = TEAM[`${user.id}|${params.formId}`];
    return permissions ? [{ formId: params.formId, permissions }] : [];
  });
  jest.spyOn(authService, 'checkSubmissionPermission').mockImplementation(async (user, submissionId, permissions) => {
    const granted = SUBMISSION_USERS[`${user.id}|${submissionId}`] || [];
    return permissions.every((p) => granted.includes(p)) ? { permission: permissions[0] } : undefined;
  });
  jest.spyOn(formService, 'readApiKey').mockImplementation(async (formId) => (formId === forms.login.id ? { secret: formApiSecret, filesApiAccess: true } : undefined));
  jest.spyOn(submissionService, 'read').mockImplementation(async (id) => {
    const s = findSubmission(id);
    if (!s) throw new Error('NotFoundError');
    return { submission: { id: s.id }, form: { id: s.form.id } };
  });
  jest.spyOn(fileService, 'read').mockImplementation(async (id) => {
    const found = Object.values(FILES).find((f) => f.id === id);
    if (!found) throw new Error('NotFoundError');
    return found;
  });
  jest.spyOn(fileService, 'isPackageFile').mockImplementation(async (id) => id === FILES.packageFile.id);
  jest.spyOn(fileService, 'clone').mockImplementation(async (id) => ({ ...FILES.jdoeUpload, id: uuid.v4(), clonedFrom: id }));
  jest.spyOn(storageService, 'read').mockImplementation(async () => Readable.from([Buffer.from('file-bytes')]));
});

afterEach(() => {
  jest.restoreAllMocks();
});

const get = (file, { token, basic, query, suffix = '' } = {}) => {
  let req = appRequest.get(`${basePath}/${file.id}${suffix}`);
  if (query) req = req.query(query);
  if (token) req = req.set('Authorization', `Bearer ${token}`);
  if (basic) req = req.set('Authorization', basicAuthFor(basic));
  return req;
};

const expectGateDenied = (response) => {
  expect(response.status).toBe(403);
  expect(response.body.detail).toBe(GATE_DENIED);
  expect(storageService.read).not.toBeCalled();
};

describe('GET /files/:fileId', () => {
  describe('unattached files', () => {
    it('403s an anonymous caller on an anonymous upload', async () => {
      expectGateDenied(await get(FILES.publicUpload));
    });

    it('serves a package file to an anonymous caller', async () => {
      const response = await get(FILES.packageFile);

      expect(response.status).toBe(200);
      expect(response.text).toBe('file-bytes');
    });

    it('403s a package marker that no package job references', async () => {
      expectGateDenied(await get(FILES.strayMarker));
    });

    it('serves an upload to its signed-in creator', async () => {
      const response = await get(FILES.jdoeUpload, { token: 'idir-jdoe' });

      expect(response.status).toBe(200);
      expect(response.text).toBe('file-bytes');
    });

    it('403s another signed-in user', async () => {
      expectGateDenied(await get(FILES.jdoeUpload, { token: 'idir-asmith' }));
    });

    it('403s a Basic BCeID user on their own upload', async () => {
      expectGateDenied(await get(FILES.bobUpload, { token: 'basic-bob' }));
    });

    it('403s a BC Services Card user on another BC Services Card upload', async () => {
      expectGateDenied(await get(FILES.bcscUpload, { token: 'bcsc-two' }));
    });

    it('serves a package file to signed-in users, Basic BCeID included', async () => {
      expect((await get(FILES.packageFile, { token: 'basic-bob' })).status).toBe(200);
      expect((await get(FILES.packageFile, { token: 'idir-asmith' })).status).toBe(200);
    });

    it('403s a valid form API key', async () => {
      expectGateDenied(await get(FILES.publicUpload, { basic: forms.login.id, query: { formId: forms.login.id } }));
    });
  });

  describe('attached files', () => {
    it('403s an anonymous caller', async () => {
      expectGateDenied(await get(FILES.login));
      expect(authService.getSubmissionForm).not.toBeCalled();
    });

    it('403s a Basic BCeID user', async () => {
      expectGateDenied(await get(FILES.publicShared, { token: 'basic-bob' }));
      expect(authService.getSubmissionForm).not.toBeCalled();
    });

    it('serves a team reviewer', async () => {
      expect((await get(FILES.login, { token: 'idir-reviewer' })).status).toBe(200);
    });

    it('serves the submitter through their submission permissions', async () => {
      expect((await get(FILES.login, { token: 'idir-jdoe' })).status).toBe(200);
    });

    it('401s a signed-in user with no access to the submission', async () => {
      const response = await get(FILES.login, { token: 'idir-asmith' });

      expect(response.status).toBe(401);
      expect(response.body.detail).toBe(NO_SUBMISSION_ACCESS);
      expect(storageService.read).not.toBeCalled();
    });

    it('401s the submitter on a deleted submission', async () => {
      const response = await get(FILES.loginDeleted, { token: 'idir-jdoe' });

      expect(response.status).toBe(401);
      expect(response.body.detail).toBe(NO_SUBMISSION_ACCESS);
    });

    it('serves any other signed-in user on a public form with URL sharing on', async () => {
      expect((await get(FILES.publicShared, { token: 'idir-asmith' })).status).toBe(200);
    });

    it('401s other signed-in users on a public form with URL sharing off', async () => {
      const response = await get(FILES.publicPrivate, { token: 'idir-asmith' });

      expect(response.status).toBe(401);
      expect(response.body.detail).toBe(NO_SUBMISSION_ACCESS);
    });

    it('403s a formSubmissionId query that names a submission the caller can read', async () => {
      // asmith can read the shared public submission, but the file is on the login form.
      expectGateDenied(await get(FILES.login, { token: 'idir-asmith', query: { formSubmissionId: submissions.publicShared.id } }));
      expect(authService.getSubmissionForm).not.toBeCalled();
    });

    it('serves the form API key, resolved through the file submission', async () => {
      const response = await get(FILES.login, { basic: forms.login.id });

      expect(response.status).toBe(200);
      expect(submissionService.read).toBeCalledWith(submissions.login.id);
      expect(authService.getSubmissionForm).not.toBeCalled();
    });

    it('401s a form API key for a different form', async () => {
      const response = await get(FILES.publicShared, { basic: forms.login.id });

      expect(response.status).toBe(401);
      expect(storageService.read).not.toBeCalled();
    });
  });

  it('403s an unknown file id', async () => {
    const response = await appRequest.get(`${basePath}/${uuid.v4()}`);

    expect(response.status).toBe(403);
    expect(response.body.detail).toBe(NOT_FOUND);
  });
});

describe('GET /files/:fileId/clone', () => {
  it('403s an anonymous caller on an anonymous upload', async () => {
    const response = await get(FILES.publicUpload, { suffix: '/clone' });

    expect(response.status).toBe(403);
    expect(response.body.detail).toBe(GATE_DENIED);
    expect(fileService.clone).not.toBeCalled();
  });

  it('clones for the creator of an unattached upload', async () => {
    const response = await get(FILES.jdoeUpload, { token: 'idir-jdoe', suffix: '/clone' });

    expect(response.status).toBe(201);
    expect(fileService.clone).toBeCalledWith(FILES.jdoeUpload.id, expect.objectContaining({ usernameIdp: 'jdoe@idir' }));
  });
});
