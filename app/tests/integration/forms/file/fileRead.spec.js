const { Readable } = require('node:stream');
const Knex = require('knex');
const { Model } = require('objection');
const request = require('supertest');
const uuid = require('uuid');

const knexfile = require('../../../../knexfile');
const { expressHelper } = require('../../../common/helper');
const idpService = require('../../../../src/components/idpService');
const jwtService = require('../../../../src/components/jwtService');
const storageService = require('../../../../src/forms/file/storage/storageService');
const { PackageJobStatuses, SystemUsers } = require('../../../../src/forms/common/constants');

//
// File reads against a real database: the identity provider list, the user
// upsert on login, the package job lookup and the submission permission
// queries all run for real. Only JWT signature verification and the object
// store are stubbed.
//
// Needs a migrated Postgres. Run it inside the devcontainer, where
// NODE_CONFIG_DIR points at .devcontainer/chefs_local and supplies the local
// database credentials:
//   docker compose -f .devcontainer/chefs_local/docker-compose.yml up postgres -d
//   (cd app && npm run migrate)
//   (cd app && npm run test:integration -- tests/integration/forms/file/fileRead.spec.js)
//   docker compose -f .devcontainer/chefs_local/docker-compose.yml down
//
// It writes rows to the configured database, so it refuses to run unless the
// database host is local or CHEFS_IT_ALLOW_DB=true is set. Rows are tagged
// with PREFIX; leftovers from an interrupted run are swept before seeding, and
// this run's rows are removed in afterAll.
//

const PREFIX = 'it-fileRead-';
const TAG = `${PREFIX}${uuid.v4().slice(0, 8)}`;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const ids = {
  users: { jdoe: uuid.v4(), asmith: uuid.v4(), reviewer: uuid.v4(), bob: uuid.v4() },
  guids: { jdoe: uuid.v4(), asmith: uuid.v4(), reviewer: uuid.v4(), bob: uuid.v4() },
  forms: { pub: uuid.v4(), pubPrivate: uuid.v4(), idir: uuid.v4(), basic: uuid.v4() },
  versions: { pub: uuid.v4(), pubPrivate: uuid.v4(), idir: uuid.v4(), basic: uuid.v4() },
  submissions: { pub: uuid.v4(), pubPrivate: uuid.v4(), idir: uuid.v4(), basic: uuid.v4() },
  files: {
    pub: uuid.v4(),
    pubPrivate: uuid.v4(),
    idir: uuid.v4(),
    basic: uuid.v4(),
    pkg: uuid.v4(),
    stray: uuid.v4(),
    basicUpload: uuid.v4(),
    jdoeUpload: uuid.v4(),
  },
  job: uuid.v4(),
};

const users = [
  { key: 'jdoe', idpCode: 'idir' },
  { key: 'asmith', idpCode: 'idir' },
  { key: 'reviewer', idpCode: 'idir' },
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
let appRequest;

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

  const forms = [
    { key: 'pub', idp: 'public', sharing: true },
    { key: 'pubPrivate', idp: 'public', sharing: false },
    { key: 'idir', idp: 'idir', sharing: true },
    { key: 'basic', idp: 'bceid-basic', sharing: true },
  ];
  await knex('form').insert(forms.map((f) => ({ id: ids.forms[f.key], name: `${TAG}-${f.key}`, enableSubmissionUrlSharing: f.sharing, createdBy: TAG })));
  await knex('form_identity_provider').insert(forms.map((f) => ({ id: uuid.v4(), formId: ids.forms[f.key], code: f.idp, createdBy: TAG })));
  await knex('form_version').insert(
    forms.map((f) => ({ id: ids.versions[f.key], formId: ids.forms[f.key], version: 1, published: true, schema: JSON.stringify({ components: [] }), createdBy: TAG }))
  );
  await knex('form_submission').insert(
    forms.map((f) => ({
      id: ids.submissions[f.key],
      formVersionId: ids.versions[f.key],
      confirmationId: `${TAG}-${f.key}`,
      submission: JSON.stringify({ data: {} }),
      createdBy: TAG,
    }))
  );

  // The reviewer is on the team of the public and Basic BCeID forms.
  await knex('form_role_user').insert([
    { id: uuid.v4(), role: 'submission_reviewer', formId: ids.forms.pub, userId: ids.users.reviewer, createdBy: TAG },
    { id: uuid.v4(), role: 'submission_reviewer', formId: ids.forms.basic, userId: ids.users.reviewer, createdBy: TAG },
  ]);

  // Submitters on the login forms get what createSubmission grants a non-draft submitter.
  await knex('form_submission_user').insert(
    ['submission_create', 'submission_read'].flatMap((permission) => [
      { id: uuid.v4(), formSubmissionId: ids.submissions.idir, userId: ids.users.jdoe, permission, createdBy: TAG },
      { id: uuid.v4(), formSubmissionId: ids.submissions.basic, userId: ids.users.bob, permission, createdBy: TAG },
    ])
  );

  await knex('file_storage').insert([
    fileRow(ids.files.pub, { formSubmissionId: ids.submissions.pub }),
    fileRow(ids.files.pubPrivate, { formSubmissionId: ids.submissions.pubPrivate }),
    fileRow(ids.files.idir, { formSubmissionId: ids.submissions.idir, createdBy: usernameIdpOf('jdoe') }),
    fileRow(ids.files.basic, { formSubmissionId: ids.submissions.basic, createdBy: usernameIdpOf('bob') }),
    fileRow(ids.files.pkg, { updatedBy: SystemUsers.SUBMISSION_PACKAGE_WORKER }),
    fileRow(ids.files.stray, { updatedBy: SystemUsers.SUBMISSION_PACKAGE_WORKER }),
    fileRow(ids.files.basicUpload, { createdBy: usernameIdpOf('bob') }),
    fileRow(ids.files.jdoeUpload, { createdBy: usernameIdpOf('jdoe') }),
  ]);

  // Completed, so a package worker running against the same database never claims it.
  await knex('submission_package_job').insert({
    id: ids.job,
    formId: ids.forms.idir,
    submissionId: ids.submissions.idir,
    packageFileId: ids.files.pkg,
    status: PackageJobStatuses.COMPLETED,
    createdBy: TAG,
  });
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

  await step(() => knex('submission_package_job').where('createdBy', 'like', like).del());
  await step(() => knex('file_storage').where('path', 'like', `/tmp/${like}`).del());
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
  jest.spyOn(storageService, 'read').mockImplementation(async () => Readable.from([Buffer.from('file-bytes')]));

  const router = require('../../../../src/forms/file/routes');
  appRequest = request(expressHelper('/files', router));

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

const get = (fileId, token, query) => {
  let req = appRequest.get(`/files/${fileId}`);
  if (query) req = req.query(query);
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

const expectGateDenied = (response) => {
  expect(response.status).toBe(403);
  expect(response.body.detail).toBe('Unauthorized to read file.');
};

describe('file reads against the database', () => {
  it('has the Basic BCeID download restriction applied', async () => {
    const idp = await idpService.findByCode('bceid-basic');

    expect(idp?.extra?.restrictFileDownloads).toBe(true);
  });

  describe('unattached files', () => {
    it('serves a package file that a package job references, without a session', async () => {
      const response = await get(ids.files.pkg);

      expect(response.status).toBe(200);
      expect(response.text).toBe('file-bytes');
    });

    it('serves a package file to signed-in users, Basic BCeID included', async () => {
      expect((await get(ids.files.pkg, 'bob')).status).toBe(200);
      expect((await get(ids.files.pkg, 'asmith')).status).toBe(200);
    });

    it('403s a package marker that no package job references', async () => {
      expectGateDenied(await get(ids.files.stray));
    });

    it('serves an IDIR upload to its creator', async () => {
      // createdBy matches the usernameIdp that login builds from the real tokenmap.
      expect((await get(ids.files.jdoeUpload, 'jdoe')).status).toBe(200);
    });

    it('403s an IDIR upload to another IDIR user', async () => {
      expectGateDenied(await get(ids.files.jdoeUpload, 'asmith'));
    });

    it('403s a Basic BCeID user on their own upload', async () => {
      expectGateDenied(await get(ids.files.basicUpload, 'bob'));
    });
  });

  describe('public form submission, URL sharing on', () => {
    it('serves an IDIR user who is not on the team, through the share-link rule', async () => {
      expect((await get(ids.files.pub, 'asmith')).status).toBe(200);
    });

    it('403s a Basic BCeID user', async () => {
      expectGateDenied(await get(ids.files.pub, 'bob'));
    });

    it('403s an anonymous caller', async () => {
      expectGateDenied(await get(ids.files.pub));
    });
  });

  describe('public form submission, URL sharing off', () => {
    it('denies an IDIR user who is not on the team', async () => {
      expect((await get(ids.files.pubPrivate, 'asmith')).status).toBe(401);
    });
  });

  describe('IDIR login form submission', () => {
    it('serves the submitter', async () => {
      expect((await get(ids.files.idir, 'jdoe')).status).toBe(200);
    });

    it('denies another IDIR user', async () => {
      expect((await get(ids.files.idir, 'asmith')).status).toBe(401);
    });

    it('403s another IDIR user who names a submission they can read', async () => {
      expectGateDenied(await get(ids.files.idir, 'asmith', { formSubmissionId: ids.submissions.pub }));
    });
  });

  describe('Basic BCeID login form submission', () => {
    it('403s the Basic BCeID submitter', async () => {
      expectGateDenied(await get(ids.files.basic, 'bob'));
    });

    it('serves a team reviewer, who has no other route to it', async () => {
      expect((await get(ids.files.basic, 'reviewer')).status).toBe(200);
    });
  });
});
