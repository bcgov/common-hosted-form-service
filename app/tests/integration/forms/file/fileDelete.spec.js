const Knex = require('knex');
const { Model } = require('objection');
const request = require('supertest');
const uuid = require('uuid');

const knexfile = require('../../../../knexfile');
const { expressHelper } = require('../../../common/helper');
const jwtService = require('../../../../src/components/jwtService');
const storageService = require('../../../../src/forms/file/storage/storageService');

//
// File deletes, and form API keys on files and submissions, against a real
// database: the identity provider list, the user upsert on login, the file
// and submission lookups, the API key lookup, the submission permission
// queries and the file row delete all run for real. Only JWT signature
// verification and the object store are stubbed.
//
// Needs a migrated Postgres. Run it inside the devcontainer, where
// NODE_CONFIG_DIR points at .devcontainer/chefs_local and supplies the local
// database credentials:
//   docker compose -f .devcontainer/chefs_local/docker-compose.yml up postgres -d
//   (cd app && npm run migrate)
//   (cd app && npm run test:integration -- tests/integration/forms/file/fileDelete.spec.js)
//   docker compose -f .devcontainer/chefs_local/docker-compose.yml down
//
// It writes rows to the configured database, so it refuses to run unless the
// database host is local or CHEFS_IT_ALLOW_DB=true is set. Rows are tagged
// with PREFIX; leftovers from an interrupted run are swept before seeding, and
// this run's rows are removed in afterAll.
//

const PREFIX = 'it-fileDelete-';
const TAG = `${PREFIX}${uuid.v4().slice(0, 8)}`;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const ids = {
  users: { jdoe: uuid.v4(), asmith: uuid.v4(), bob: uuid.v4() },
  guids: { jdoe: uuid.v4(), asmith: uuid.v4(), bob: uuid.v4() },
  forms: { mine: uuid.v4(), theirs: uuid.v4() },
  versions: { mine: uuid.v4(), theirs: uuid.v4() },
  submissions: { draft: uuid.v4(), submitted: uuid.v4(), theirs: uuid.v4() },
  files: {
    publicUpload: uuid.v4(),
    publicUploadKept: uuid.v4(),
    jdoeUpload: uuid.v4(),
    jdoeUploadKept: uuid.v4(),
    bobUpload: uuid.v4(),
    embedUpload: uuid.v4(),
    draft: uuid.v4(),
    draftKept: uuid.v4(),
    submitted: uuid.v4(),
    submittedByKey: uuid.v4(),
    theirs: uuid.v4(),
  },
};
const secrets = { mine: uuid.v4() };

const users = [
  { key: 'jdoe', idpCode: 'idir' },
  { key: 'asmith', idpCode: 'idir' },
  { key: 'bob', idpCode: 'bceid-basic' },
];
const usernameOf = (key) => `${TAG}-${key}`;
const usernameIdpOf = (key) => `${usernameOf(key)}@${users.find((u) => u.key === key).idpCode}`;

// Bearer token -> verified JWT payload, shaped for the real tokenmaps.
const payload = ({ key, idpCode }) =>
  idpCode === 'idir'
    ? { identity_provider: 'idir', idir_user_guid: ids.guids[key], idir_username: usernameOf(key), name: key, email: `${key}@example.com` }
    : { identity_provider: 'bceidbasic', bceid_user_guid: ids.guids[key], bceid_username: usernameOf(key), name: key, email: `${key}@example.com` };
const TOKENS = Object.fromEntries(users.map((u) => [u.key, payload(u)]));

let knex;
let filesRequest;
let submissionsRequest;

const fileRow = (id, extra) => ({
  id,
  originalName: 'a.txt',
  mimeType: 'text/plain',
  size: 10,
  path: `/tmp/${TAG}/${id}`,
  storage: 'localStorage',
  createdBy: 'public',
  ...extra,
});

const seed = async () => {
  await knex('user').insert(
    users.map((u) => ({
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

  const forms = ['mine', 'theirs'];
  await knex('form').insert(forms.map((f) => ({ id: ids.forms[f], name: `${TAG}-${f}`, createdBy: TAG })));
  await knex('form_identity_provider').insert(forms.map((f) => ({ id: uuid.v4(), formId: ids.forms[f], code: 'idir', createdBy: TAG })));
  await knex('form_version').insert(
    forms.map((f) => ({ id: ids.versions[f], formId: ids.forms[f], version: 1, published: true, schema: JSON.stringify({ components: [] }), createdBy: TAG }))
  );
  await knex('form_submission').insert(
    [
      ['draft', 'mine'],
      ['submitted', 'mine'],
      ['theirs', 'theirs'],
    ].map(([s, f]) => ({
      id: ids.submissions[s],
      formVersionId: ids.versions[f],
      confirmationId: `${TAG}-${s}`.slice(0, 40),
      submission: JSON.stringify({ data: {} }),
      createdBy: TAG,
    }))
  );

  // Only "mine" has an API key, and it may use the files API.
  await knex('form_api_key').insert({ formId: ids.forms.mine, secret: secrets.mine, filesApiAccess: true, createdBy: TAG });

  // jdoe can update the draft, and only read the submitted one.
  await knex('form_submission_user').insert([
    ...['submission_create', 'submission_read', 'submission_update'].map((permission) => ({
      id: uuid.v4(),
      formSubmissionId: ids.submissions.draft,
      userId: ids.users.jdoe,
      permission,
      createdBy: TAG,
    })),
    ...['submission_create', 'submission_read'].map((permission) => ({
      id: uuid.v4(),
      formSubmissionId: ids.submissions.submitted,
      userId: ids.users.jdoe,
      permission,
      createdBy: TAG,
    })),
  ]);

  await knex('file_storage').insert([
    fileRow(ids.files.publicUpload),
    fileRow(ids.files.publicUploadKept),
    fileRow(ids.files.jdoeUpload, { createdBy: usernameIdpOf('jdoe') }),
    fileRow(ids.files.jdoeUploadKept, { createdBy: usernameIdpOf('jdoe') }),
    fileRow(ids.files.bobUpload, { createdBy: usernameIdpOf('bob') }),
    fileRow(ids.files.embedUpload, { createdBy: 'api-user' }),
    fileRow(ids.files.draft, { formSubmissionId: ids.submissions.draft, createdBy: usernameIdpOf('jdoe') }),
    fileRow(ids.files.draftKept, { formSubmissionId: ids.submissions.draft, createdBy: usernameIdpOf('jdoe') }),
    fileRow(ids.files.submitted, { formSubmissionId: ids.submissions.submitted, createdBy: usernameIdpOf('jdoe') }),
    fileRow(ids.files.submittedByKey, { formSubmissionId: ids.submissions.submitted, createdBy: usernameIdpOf('jdoe') }),
    fileRow(ids.files.theirs, { formSubmissionId: ids.submissions.theirs }),
  ]);
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
  let formIds = [];
  await step(async () => {
    submissionIds = (await knex('form_submission').select('id').where('createdBy', 'like', like)).map((r) => r.id);
    formIds = (await knex('form').select('id').where('createdBy', 'like', like)).map((r) => r.id);
  });

  await step(() => knex('file_storage').where('path', 'like', `/tmp/${like}`).del());
  await step(() => knex('form_submission_user').where('createdBy', 'like', like).del());
  await step(() => knex('form_submission').whereIn('id', submissionIds).del());
  await step(() => knex('form_submission_audit').whereIn('submissionId', submissionIds).del());
  await step(() => knex('form_api_key').whereIn('formId', formIds).del());
  await step(() => knex('form_api_key_audit').whereIn('formId', formIds).del());
  await step(() => knex('form_identity_provider').where('createdBy', 'like', like).del());
  await step(() => knex('form_version').where('createdBy', 'like', like).del());
  await step(() => knex('form').whereIn('id', formIds).del());
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
  jest.spyOn(storageService, 'delete').mockResolvedValue(true);

  filesRequest = request(expressHelper('/files', require('../../../../src/forms/file/routes')));
  submissionsRequest = request(expressHelper('/submissions', require('../../../../src/forms/submission/routes')));

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

const basicAuthFor = (formId, secret) => `Basic ${Buffer.from([formId, secret].join(':')).toString('base64')}`;
const MINE_KEY = () => basicAuthFor(ids.forms.mine, secrets.mine);

const del = (fileId, { token, basic, query } = {}) => {
  let req = filesRequest.delete(`/files/${fileId}`);
  if (query) req = req.query(query);
  if (token) req = req.set('Authorization', `Bearer ${token}`);
  if (basic) req = req.set('Authorization', basic);
  return req;
};

const fileExists = async (id) => !!(await knex('file_storage').where('id', id).first());

const expectDeleted = async (response, id) => {
  expect(response.status).toBe(202);
  expect(await fileExists(id)).toBe(false);
};

const expectKept = async (response, id, status) => {
  expect(response.status).toBe(status);
  expect(await fileExists(id)).toBe(true);
};

describe('file deletes against the database', () => {
  describe('unattached files', () => {
    it('keeps an upload that another signed-in user tries to delete', async () => {
      await expectKept(await del(ids.files.jdoeUploadKept, { token: 'asmith' }), ids.files.jdoeUploadKept, 403);
    });

    it('keeps a signed-in upload that an anonymous caller tries to delete', async () => {
      await expectKept(await del(ids.files.jdoeUploadKept), ids.files.jdoeUploadKept, 403);
    });

    it('deletes an upload for its creator', async () => {
      // createdBy matches the usernameIdp that login builds from the real tokenmap.
      await expectDeleted(await del(ids.files.jdoeUpload, { token: 'jdoe' }), ids.files.jdoeUpload);
    });

    it('deletes a Basic BCeID upload for its creator', async () => {
      await expectDeleted(await del(ids.files.bobUpload, { token: 'bob' }), ids.files.bobUpload);
    });

    it('keeps a webcomponents upload', async () => {
      await expectKept(await del(ids.files.embedUpload), ids.files.embedUpload, 403);
    });

    it('keeps an anonymous upload that a form API key tries to delete', async () => {
      await expectKept(await del(ids.files.publicUploadKept, { basic: MINE_KEY() }), ids.files.publicUploadKept, 401);
    });

    it('deletes an anonymous upload for an anonymous caller', async () => {
      await expectDeleted(await del(ids.files.publicUpload), ids.files.publicUpload);
    });
  });

  describe('attached files', () => {
    it('keeps a file when the submitter can only read the submission', async () => {
      await expectKept(await del(ids.files.submitted, { token: 'jdoe' }), ids.files.submitted, 401);
    });

    it('keeps a file when a signed-in user has no access to the submission', async () => {
      await expectKept(await del(ids.files.draftKept, { token: 'asmith' }), ids.files.draftKept, 401);
    });

    it('keeps a file when the formSubmissionId query names another submission', async () => {
      await expectKept(await del(ids.files.submitted, { token: 'jdoe', query: { formSubmissionId: ids.submissions.draft } }), ids.files.submitted, 403);
    });

    it('deletes for a submitter who can update the submission', async () => {
      await expectDeleted(await del(ids.files.draft, { token: 'jdoe' }), ids.files.draft);
    });

    it('deletes for the form API key', async () => {
      await expectDeleted(await del(ids.files.submittedByKey, { basic: MINE_KEY() }), ids.files.submittedByKey);
    });
  });

  describe('a form API key and a formId query that names its own form', () => {
    it('cannot read a file of another form', async () => {
      const response = await filesRequest.get(`/files/${ids.files.theirs}`).query({ formId: ids.forms.mine }).set('Authorization', MINE_KEY());

      expect(response.status).toBe(401);
    });

    it('cannot delete a file of another form', async () => {
      await expectKept(await del(ids.files.theirs, { basic: MINE_KEY(), query: { formId: ids.forms.mine } }), ids.files.theirs, 401);
    });

    it('cannot read a submission of another form', async () => {
      const response = await submissionsRequest.get(`/submissions/${ids.submissions.theirs}`).query({ formId: ids.forms.mine }).set('Authorization', MINE_KEY());

      expect(response.status).toBe(401);
      expect(response.body.submission).toBeUndefined();
    });

    it('still reads a submission of its own form', async () => {
      const response = await submissionsRequest.get(`/submissions/${ids.submissions.submitted}`).query({ formId: ids.forms.mine }).set('Authorization', MINE_KEY());

      expect(response.status).toBe(200);
      expect(response.body.submission.id).toBe(ids.submissions.submitted);
    });
  });
});
