const { NotFoundError } = require('objection');
const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../common/helper');

//
// File deletes through the real router and middleware chain: currentUser,
// basicApiAccess, currentFileRecord, hasFileDelete and hasSubmissionPermissions
// all run for real. Only I/O edges are stubbed: JWT signature verification,
// the identity provider list, the user upsert and login history, the
// submission and form permission queries, file lookups, the form API key
// lookup, and the delete itself (database row and stored object).
//
const authService = require('../../../../src/forms/auth/service');
const formService = require('../../../../src/forms/form/service');
const submissionService = require('../../../../src/forms/submission/service');
const fileService = require('../../../../src/forms/file/service');
const idpService = require('../../../../src/components/idpService');
const jwtService = require('../../../../src/components/jwtService');
const { SystemUsers } = require('../../../../src/forms/common/constants');

const router = require('../../../../src/forms/file/routes');

const basePath = '/files';
const appRequest = request(expressHelper(basePath, router));

const DELETE_DENIED = 'Unauthorized to delete file.';
const NOT_FOUND = 'File access to this ID is unauthorized.';
const NO_SUBMISSION_ACCESS = 'You do not have access to this submission.';
const API_KEY_DENIED = 'Invalid authorization credentials.';

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
];

// Bearer token -> verified JWT payload.
const TOKENS = {
  'idir-jdoe': { identity_provider: 'idir', idir_user_guid: uuid.v4(), idir_username: 'jdoe', name: 'J Doe', email: 'jdoe@example.com' },
  'idir-asmith': { identity_provider: 'idir', idir_user_guid: uuid.v4(), idir_username: 'asmith', name: 'A Smith', email: 'asmith@example.com' },
  'idir-reviewer': { identity_provider: 'idir', idir_user_guid: uuid.v4(), idir_username: 'reviewer', name: 'Reviewer', email: 'rev@example.com' },
  'basic-bob': { identity_provider: 'bceidbasic', bceid_user_guid: uuid.v4(), bceid_username: 'bob', name: 'Bob', email: 'bob@example.com' },
};

const USER_IDS = Object.fromEntries(Object.keys(TOKENS).map((t) => [t, uuid.v4()]));
const userIdFor = (userInfo) => {
  const entry = Object.entries(TOKENS).find(([, p]) => (p.idir_user_guid || p.bceid_user_guid) === userInfo.idpUserId);
  return entry ? USER_IDS[entry[0]] : uuid.v4();
};

const forms = {
  login: { id: uuid.v4(), identityProviders: [{ code: 'idir' }], enableSubmissionUrlSharing: true },
  other: { id: uuid.v4(), identityProviders: [{ code: 'idir' }], enableSubmissionUrlSharing: true },
};

const submissions = {
  draft: { id: uuid.v4(), form: forms.login, deleted: false },
  submitted: { id: uuid.v4(), form: forms.login, deleted: false },
  other: { id: uuid.v4(), form: forms.other, deleted: false },
};

// Team roles: the reviewer can update submissions on the login form.
const TEAM = { [`${USER_IDS['idir-reviewer']}|${forms.login.id}`]: ['form_read', 'submission_read', 'submission_update'] };
// Submission users: jdoe owns the draft, and can only read the submitted one.
const SUBMISSION_USERS = {
  [`${USER_IDS['idir-jdoe']}|${submissions.draft.id}`]: ['submission_create', 'submission_read', 'submission_update'],
  [`${USER_IDS['idir-jdoe']}|${submissions.submitted.id}`]: ['submission_create', 'submission_read'],
};

const formApiSecret = uuid.v4();
const basicAuthFor = (formId) => `Basic ${Buffer.from([formId, formApiSecret].join(':')).toString('base64')}`;

const row = (overrides) => ({
  id: uuid.v4(),
  originalName: 'a.txt',
  mimeType: 'text/plain',
  size: 10,
  storage: 'localStorage',
  path: 'uploads/none',
  createdBy: 'public',
  updatedBy: null,
  formSubmissionId: null,
  ...overrides,
});

const FILES = {
  publicUpload: row({}),
  jdoeUpload: row({ createdBy: 'jdoe@idir' }),
  bobUpload: row({ createdBy: 'bob@bceid-basic' }),
  embedUpload: row({ createdBy: 'api-user' }),
  packageFile: row({ updatedBy: SystemUsers.SUBMISSION_PACKAGE_WORKER }),
  draft: row({ formSubmissionId: submissions.draft.id, createdBy: 'jdoe@idir' }),
  submitted: row({ formSubmissionId: submissions.submitted.id, createdBy: 'jdoe@idir' }),
  other: row({ formSubmissionId: submissions.other.id }),
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
    if (!s) throw new NotFoundError({});
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
    if (!s) throw new NotFoundError({});
    return { submission: { id: s.id }, form: { id: s.form.id } };
  });
  jest.spyOn(fileService, 'read').mockImplementation(async (id) => {
    const found = Object.values(FILES).find((f) => f.id === id);
    if (!found) throw new NotFoundError({});
    return found;
  });
  jest.spyOn(fileService, 'delete').mockResolvedValue(true);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const del = (file, { token, basic, query } = {}) => {
  let req = appRequest.delete(`${basePath}/${file.id}`);
  if (query) req = req.query(query);
  if (token) req = req.set('Authorization', `Bearer ${token}`);
  if (basic) req = req.set('Authorization', basicAuthFor(basic));
  return req;
};

const expectDeleted = (response, file) => {
  expect(response.status).toBe(202);
  expect(fileService.delete).toBeCalledWith(file.id);
};

const expectDenied = (response, status, detail) => {
  expect(response.status).toBe(status);
  expect(response.body.detail).toBe(detail);
  expect(fileService.delete).not.toBeCalled();
};

describe('DELETE /files/:fileId', () => {
  describe('unattached files', () => {
    it('deletes an anonymous upload for an anonymous caller', async () => {
      expectDeleted(await del(FILES.publicUpload), FILES.publicUpload);
    });

    it('deletes an upload for its signed-in creator', async () => {
      expectDeleted(await del(FILES.jdoeUpload, { token: 'idir-jdoe' }), FILES.jdoeUpload);
    });

    it('deletes a Basic BCeID upload for its creator', async () => {
      expectDeleted(await del(FILES.bobUpload, { token: 'basic-bob' }), FILES.bobUpload);
    });

    it('403s another signed-in user', async () => {
      expectDenied(await del(FILES.jdoeUpload, { token: 'idir-asmith' }), 403, DELETE_DENIED);
    });

    it('403s an anonymous caller on a signed-in upload', async () => {
      expectDenied(await del(FILES.jdoeUpload), 403, DELETE_DENIED);
    });

    it('403s a webcomponents upload', async () => {
      expectDenied(await del(FILES.embedUpload), 403, DELETE_DENIED);
    });

    it('403s a package file, signed in or not', async () => {
      expectDenied(await del(FILES.packageFile), 403, DELETE_DENIED);
      expectDenied(await del(FILES.packageFile, { token: 'idir-jdoe' }), 403, DELETE_DENIED);
    });

    it('401s a form API key, before the delete gate', async () => {
      expectDenied(await del(FILES.publicUpload, { basic: forms.login.id }), 401, API_KEY_DENIED);
      expect(formService.readApiKey).not.toBeCalled();
    });

    it('403s a formSubmissionId query', async () => {
      expectDenied(await del(FILES.publicUpload, { query: { formSubmissionId: submissions.draft.id } }), 403, DELETE_DENIED);
    });
  });

  describe('attached files', () => {
    it('403s an anonymous caller', async () => {
      expectDenied(await del(FILES.draft), 403, DELETE_DENIED);
      expect(authService.getSubmissionForm).not.toBeCalled();
    });

    it('deletes for a submitter who can update the submission', async () => {
      expectDeleted(await del(FILES.draft, { token: 'idir-jdoe' }), FILES.draft);
    });

    it('401s a submitter who can only read the submission', async () => {
      expectDenied(await del(FILES.submitted, { token: 'idir-jdoe' }), 401, NO_SUBMISSION_ACCESS);
    });

    it('deletes for a team member with submission update', async () => {
      expectDeleted(await del(FILES.submitted, { token: 'idir-reviewer' }), FILES.submitted);
    });

    it('401s a signed-in user with no access to the submission', async () => {
      expectDenied(await del(FILES.draft, { token: 'idir-asmith' }), 401, NO_SUBMISSION_ACCESS);
    });

    it('403s a formSubmissionId query that names a submission the caller can update', async () => {
      // jdoe can update the draft, but the file is on the submitted one.
      expectDenied(await del(FILES.submitted, { token: 'idir-jdoe', query: { formSubmissionId: submissions.draft.id } }), 403, DELETE_DENIED);
      expect(authService.getSubmissionForm).not.toBeCalled();
    });

    it('deletes for the form API key, resolved through the file submission', async () => {
      expectDeleted(await del(FILES.draft, { basic: forms.login.id }), FILES.draft);
      expect(authService.getSubmissionForm).not.toBeCalled();
    });

    it('401s a form API key for a different form', async () => {
      expectDenied(await del(FILES.other, { basic: forms.login.id }), 401, API_KEY_DENIED);
    });

    it('401s a form API key whose formId query names its own form, on a file of another form', async () => {
      expectDenied(await del(FILES.other, { basic: forms.login.id, query: { formId: forms.login.id } }), 401, API_KEY_DENIED);
      expect(formService.readApiKey).not.toBeCalled();
    });
  });

  it('403s an unknown file id', async () => {
    const response = await appRequest.delete(`${basePath}/${uuid.v4()}`);

    expectDenied(response, 403, NOT_FOUND);
    expect(response.headers['x-robots-tag']).toBe('noindex, nofollow');
  });
});

describe('removed file routes', () => {
  it('has no bulk DELETE /files', async () => {
    const response = await appRequest.delete(basePath).send({ fileIds: [FILES.publicUpload.id] });

    expect(response.status).toBe(404);
    expect(fileService.delete).not.toBeCalled();
  });

  it('has no GET /files/:fileId/clone', async () => {
    const response = await appRequest.get(`${basePath}/${FILES.jdoeUpload.id}/clone`).set('Authorization', 'Bearer idir-jdoe');

    expect(response.status).toBe(404);
  });
});
