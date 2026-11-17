const express = require('express');
const Knex = require('knex');
const { Model } = require('objection');
const request = require('supertest');
const uuid = require('uuid');

const knexfile = require('../../../../knexfile');
const jwtService = require('../../../../src/components/jwtService');
const { currentUser } = require('../../../../src/forms/auth/middleware/userAccess');
const { hasFileCreate } = require('../../../../src/forms/file/middleware/filePermissions');
const middleware = require('../../../../src/forms/common/middleware');

//
// Who may upload a file for which form, against a real database: the user
// upsert on login, the form lookup, the form access views (submitter access
// by identity provider, team roles) and the submission permission tables all
// run for real. The app mounts the two checks POST /files runs before the
// upload, currentUser then hasFileCreate; the rate limiters and the upload
// itself (multer, ClamAV, storage) are not part of this, and a request that
// passes answers 204. Only JWT signature verification is stubbed.
//
// Needs a migrated Postgres. Run it inside the devcontainer, where
// NODE_CONFIG_DIR points at .devcontainer/chefs_local and supplies the local
// database credentials:
//   docker compose -f .devcontainer/chefs_local/docker-compose.yml up postgres -d
//   (cd app && npm run migrate)
//   (cd app && npm run test:integration -- tests/integration/forms/file/fileCreate.spec.js)
//   docker compose -f .devcontainer/chefs_local/docker-compose.yml down
//
// It writes rows to the configured database, so it refuses to run unless the
// database host is local or CHEFS_IT_ALLOW_DB=true is set. Rows are tagged
// with PREFIX; leftovers from an interrupted run are swept before seeding, and
// this run's rows are removed in afterAll.
//

const PREFIX = 'it-fileCreate-';
const TAG = `${PREFIX}${uuid.v4().slice(0, 8)}`;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const USERS = [
  { key: 'jdoe', idpCode: 'idir' },
  { key: 'designer', idpCode: 'idir' },
  { key: 'reviewer', idpCode: 'idir' },
  { key: 'collaborator', idpCode: 'idir' },
  { key: 'stranger', idpCode: 'idir' },
  { key: 'bob', idpCode: 'bceid-basic' },
];
// teamOnly lists no identity provider: only its team can submit, and drafts
// on it can be shared with anyone.
const FORMS = [
  { key: 'pubPublished', idps: ['public'], published: true },
  { key: 'pubUnpublished', idps: ['public'], published: false },
  { key: 'idirPublished', idps: ['idir'], published: true },
  { key: 'idirUnpublished', idps: ['idir'], published: false },
  { key: 'teamOnly', idps: [], published: true },
  { key: 'deleted', idps: ['idir'], published: true, active: false },
];
const SUBMISSIONS = [
  // A draft on the team-only form, shared with collaborator.
  { key: 'sharedDraft', form: 'teamOnly' },
  { key: 'deletedDraft', form: 'teamOnly', deleted: true },
  // jdoe's draft on a form whose only version is unpublished.
  { key: 'jdoeDraft', form: 'idirUnpublished' },
];
const ids = {
  users: Object.fromEntries(USERS.map((u) => [u.key, uuid.v4()])),
  guids: Object.fromEntries(USERS.map((u) => [u.key, uuid.v4()])),
  forms: Object.fromEntries(FORMS.map((f) => [f.key, uuid.v4()])),
  versions: Object.fromEntries(FORMS.map((f) => [f.key, uuid.v4()])),
  submissions: Object.fromEntries(SUBMISSIONS.map((s) => [s.key, uuid.v4()])),
};

const usernameOf = (key) => `${TAG}-${key}`;
const TOKENS = Object.fromEntries(
  USERS.map(({ key, idpCode }) => [
    key,
    idpCode === 'idir'
      ? { identity_provider: 'idir', idir_user_guid: ids.guids[key], idir_username: usernameOf(key), name: key, email: `${key}@example.com` }
      : { identity_provider: 'bceidbasic', bceid_user_guid: ids.guids[key], bceid_username: usernameOf(key), name: key, email: `${key}@example.com` },
  ])
);

let knex;
let appRequest;

const seed = async () => {
  await knex('user').insert(
    USERS.map((u) => ({
      id: ids.users[u.key],
      idpUserId: ids.guids[u.key],
      keycloakId: ids.guids[u.key],
      username: usernameOf(u.key),
      fullName: u.key,
      email: `${u.key}@example.com`,
      idpCode: u.idpCode,
      createdBy: TAG,
    }))
  );
  await knex('form').insert(FORMS.map((f) => ({ id: ids.forms[f.key], name: `${TAG}-${f.key}`, active: f.active !== false, createdBy: TAG })));
  const providers = FORMS.flatMap((f) => f.idps.map((code) => ({ id: uuid.v4(), formId: ids.forms[f.key], code, createdBy: TAG })));
  if (providers.length) await knex('form_identity_provider').insert(providers);
  await knex('form_version').insert(
    FORMS.map((f) => ({ id: ids.versions[f.key], formId: ids.forms[f.key], version: 1, published: f.published, schema: JSON.stringify({ components: [] }), createdBy: TAG }))
  );
  await knex('form_role_user').insert([
    { id: uuid.v4(), role: 'form_designer', formId: ids.forms.idirUnpublished, userId: ids.users.designer, createdBy: TAG },
    { id: uuid.v4(), role: 'submission_reviewer', formId: ids.forms.idirUnpublished, userId: ids.users.reviewer, createdBy: TAG },
    { id: uuid.v4(), role: 'form_designer', formId: ids.forms.deleted, userId: ids.users.designer, createdBy: TAG },
  ]);
  await knex('form_submission').insert(
    SUBMISSIONS.map((s) => ({
      id: ids.submissions[s.key],
      formVersionId: ids.versions[s.form],
      confirmationId: `${TAG}-${s.key}`.slice(0, 40),
      draft: true,
      deleted: !!s.deleted,
      submission: JSON.stringify({ data: {} }),
      createdBy: TAG,
    }))
  );
  const draftUser = (submission, user) =>
    ['submission_read', 'submission_update'].map((permission) => ({
      id: uuid.v4(),
      formSubmissionId: ids.submissions[submission],
      userId: ids.users[user],
      permission,
      createdBy: TAG,
    }));
  await knex('form_submission_user').insert([...draftUser('sharedDraft', 'collaborator'), ...draftUser('deletedDraft', 'collaborator'), ...draftUser('jdoeDraft', 'jdoe')]);
};

// Removes every row whose tag starts with `tag`. Each step runs even if an
// earlier one fails, and the failures are reported together.
const removeRows = async (tag) => {
  const like = `${tag}%`;
  const errors = [];
  const step = async (fn) => {
    try {
      await fn();
    } catch (error) {
      errors.push(error);
    }
  };

  let submissionIds = [];
  await step(async () => {
    submissionIds = (await knex('form_submission').select('id').where('createdBy', 'like', like)).map((r) => r.id);
  });

  await step(() => knex('form_submission_user').where('createdBy', 'like', like).del());
  await step(() => knex('form_submission').whereIn('id', submissionIds).del());
  await step(() => knex('form_submission_audit').whereIn('submissionId', submissionIds).del());
  await step(() => knex('form_role_user').where('createdBy', 'like', like).del());
  await step(() => knex('form_identity_provider').where('createdBy', 'like', like).del());
  await step(() => knex('form_version').where('createdBy', 'like', like).del());
  await step(() => knex('form').where('createdBy', 'like', like).del());
  await step(() => knex('user_login_history').whereIn('userId', knex('user').select('id').where('createdBy', 'like', like)).del());
  await step(() => knex('user').where('createdBy', 'like', like).del());

  if (errors.length) {
    throw new AggregateError(errors, `Failed to remove ${tag} rows`);
  }
};

beforeAll(async () => {
  const host = knexfile.connection?.host;
  if (!LOCAL_HOSTS.has(host) && process.env.CHEFS_IT_ALLOW_DB !== 'true') {
    throw new Error(`Refusing to write test rows to database host "${host}". Use a local database or set CHEFS_IT_ALLOW_DB=true.`);
  }

  knex = Knex(knexfile);
  Model.knex(knex);

  jest.spyOn(jwtService, '_verify').mockImplementation(async (token) => {
    if (!TOKENS[token]) throw new Error('unexpected token');
    return TOKENS[token];
  });

  const app = express();
  app.post('/files', currentUser, hasFileCreate, (_req, res) => res.sendStatus(204));
  app.use(middleware.errorHandler);
  appRequest = request(app);

  await removeRows(PREFIX);
  await seed();
});

afterAll(async () => {
  try {
    if (knex) await removeRows(TAG);
  } finally {
    jest.restoreAllMocks();
    if (knex) await knex.destroy();
  }
});

const upload = (formKeyOrId, token, submissionKey) => {
  const formId = ids.forms[formKeyOrId] || formKeyOrId;
  const query = [formId === undefined ? null : `formId=${formId}`, submissionKey ? `formSubmissionId=${ids.submissions[submissionKey]}` : null].filter(Boolean).join('&');
  const req = appRequest.post(query ? `/files?${query}` : '/files');
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

const expectRefused = (response, status, detail) => {
  expect(response.status).toBe(status);
  expect(response.body.detail).toBe(detail);
};

const NO_ACCESS = 'You do not have access to upload files to this form.';
const NOT_PUBLISHED = 'This form is not accepting uploads.';

describe('who may upload for which form, against the database', () => {
  it('has the role permissions these tests rely on', async () => {
    const permissionsOf = async (role) => (await knex('role_permission').select('permission').where('role', role)).map((r) => r.permission);

    expect(await permissionsOf('form_designer')).toEqual(expect.arrayContaining(['design_update']));
    expect(await permissionsOf('submission_reviewer')).toEqual(expect.arrayContaining(['submission_update']));
  });

  describe('anonymous callers', () => {
    it('upload for a published public form', async () => {
      expect((await upload('pubPublished')).status).toBe(204);
    });

    it('are refused on a public form with no published version', async () => {
      expectRefused(await upload('pubUnpublished'), 403, NOT_PUBLISHED);
    });

    it('are refused on a login-only form', async () => {
      expectRefused(await upload('idirPublished'), 403, 'Authentication required for file uploads on this form');
    });

    it('get 404 for a deleted form', async () => {
      expectRefused(await upload('deleted'), 404, 'Form not found');
    });
  });

  describe('signed-in callers', () => {
    it('upload for a login form of their identity provider, through submitter access', async () => {
      expect((await upload('idirPublished', 'jdoe')).status).toBe(204);
    });

    it('upload for a published public form', async () => {
      expect((await upload('pubPublished', 'jdoe')).status).toBe(204);
      expect((await upload('pubPublished', 'bob')).status).toBe(204);
    });

    it('are refused on a login form of another identity provider (Basic BCeID on an IDIR form)', async () => {
      expectRefused(await upload('idirPublished', 'bob'), 403, NO_ACCESS);
    });

    it('are refused as plain submitters on a form with no published version', async () => {
      expectRefused(await upload('idirUnpublished', 'jdoe'), 403, NOT_PUBLISHED);
    });

    it('upload as a designer or a submission reviewer on a form with no published version', async () => {
      expect((await upload('idirUnpublished', 'designer')).status).toBe(204);
      expect((await upload('idirUnpublished', 'reviewer')).status).toBe(204);
    });

    it('get 404 for a deleted form, a team role on it included', async () => {
      expectRefused(await upload('deleted', 'jdoe'), 404, 'Form not found');
      expectRefused(await upload('deleted', 'designer'), 404, 'Form not found');
    });

    it('get 400 without a form id, or with formId=undefined', async () => {
      expectRefused(await upload(undefined, 'jdoe'), 400, 'formId is required as query parameter for file uploads');
      expectRefused(await upload('undefined', 'reviewer'), 400, 'formId must be a valid UUID');
    });
  });

  describe('signed-in callers naming the submission they are editing', () => {
    it('upload for a draft shared with them, without access to the form', async () => {
      expectRefused(await upload('teamOnly', 'collaborator'), 403, NO_ACCESS);
      expect((await upload('teamOnly', 'collaborator', 'sharedDraft')).status).toBe(204);
    });

    it('upload for their own draft on a form with no published version', async () => {
      expectRefused(await upload('idirUnpublished', 'jdoe'), 403, NOT_PUBLISHED);
      expect((await upload('idirUnpublished', 'jdoe', 'jdoeDraft')).status).toBe(204);
    });

    it('are refused for a draft they cannot update', async () => {
      expectRefused(await upload('teamOnly', 'stranger', 'sharedDraft'), 403, NO_ACCESS);
    });

    it('are refused for a deleted draft', async () => {
      expectRefused(await upload('teamOnly', 'collaborator', 'deletedDraft'), 403, NO_ACCESS);
    });

    it('are refused when the draft is on another form', async () => {
      expectRefused(await upload('idirPublished', 'bob', 'sharedDraft'), 403, NO_ACCESS);
      expectRefused(await upload('pubUnpublished', 'collaborator', 'sharedDraft'), 403, NOT_PUBLISHED);
    });

    it('get 400 for a submission id that is not a UUID', async () => {
      const response = await appRequest.post(`/files?formId=${ids.forms.teamOnly}&formSubmissionId=x`).set('Authorization', 'Bearer collaborator');

      expectRefused(response, 400, 'formSubmissionId must be a valid UUID');
    });
  });
});
