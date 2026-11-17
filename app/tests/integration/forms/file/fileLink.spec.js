const Knex = require('knex');
const { Model } = require('objection');
const request = require('supertest');
const uuid = require('uuid');

const knexfile = require('../../../../knexfile');
const { expressHelper } = require('../../../common/helper');
const jwtService = require('../../../../src/components/jwtService');
const { eventStreamService } = require('../../../../src/components/eventStreamService');
const emailService = require('../../../../src/forms/email/emailService');
const eventService = require('../../../../src/forms/event/eventService');
const submitToEmailJobService = require('../../../../src/forms/feature/submitToEmail/jobService');
const fileService = require('../../../../src/forms/file/service');
const packageBuilder = require('../../../../src/forms/feature/submitToEmail/packageBuilder');
const storageService = require('../../../../src/forms/file/storage/storageService');
const { FILE_LINK_REJECTED } = require('../../../../src/forms/file/fileLink');
const { SystemUsers } = require('../../../../src/forms/common/constants');

//
// Linking files to submissions against a real database: the form and
// submission permission checks, the API key lookup, the submission insert or
// update, and the file reads and conditional claims all run for real,
// including two saves racing for one file. Only JWT signature verification,
// the object store, the post-create relocation to permanent storage, and
// outbound notifications (events, email, the package queue) are stubbed.
//
// Needs a migrated Postgres. Run it inside the devcontainer, where
// NODE_CONFIG_DIR points at .devcontainer/chefs_local and supplies the local
// database credentials:
//   docker compose -f .devcontainer/chefs_local/docker-compose.yml up postgres -d
//   (cd app && npm run migrate)
//   (cd app && npm run test:integration -- tests/integration/forms/file/fileLink.spec.js)
//   docker compose -f .devcontainer/chefs_local/docker-compose.yml down
//
// It writes rows to the configured database, so it refuses to run unless the
// database host is local or CHEFS_IT_ALLOW_DB=true is set. Seeded rows are
// tagged with PREFIX, and submissions the tests create are found through the
// seeded form versions; leftovers from an interrupted run are swept before
// seeding, and this run's rows are removed in afterAll. Every test uses its
// own files, so the tests do not depend on each other or on their order.
//

const PREFIX = 'it-fileLink-';
const TAG = `${PREFIX}${uuid.v4().slice(0, 8)}`;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const WORKER = SystemUsers.SUBMISSION_PACKAGE_WORKER;

const ids = {
  users: { jdoe: uuid.v4(), asmith: uuid.v4() },
  guids: { jdoe: uuid.v4(), asmith: uuid.v4() },
  forms: { idir: uuid.v4(), pub: uuid.v4() },
  versions: { idir: uuid.v4(), pub: uuid.v4() },
  submissions: { old: uuid.v4(), draft: uuid.v4(), pubOld: uuid.v4() },
};
const pubSecret = uuid.v4();

const usernameOf = (key) => `${TAG}-${key}`;
const usernameIdpOf = (key) => `${usernameOf(key)}@idir`;
const TOKENS = Object.fromEntries(
  ['jdoe', 'asmith'].map((key) => [key, { identity_provider: 'idir', idir_user_guid: ids.guids[key], idir_username: usernameOf(key), name: key, email: `${key}@example.com` }])
);

// Each test's files: who uploaded them and where they are.
const jdoePending = () => ({ createdBy: usernameIdpOf('jdoe') });
const asmithPending = () => ({ createdBy: usernameIdpOf('asmith') });
const FILE_ROWS = {
  createOwn: jdoePending(),
  createAsmith: asmithPending(),
  createCopied: { createdBy: usernameIdpOf('jdoe'), formSubmissionId: ids.submissions.old },
  createPackage: { createdBy: WORKER },
  createMovedPackageSignedIn: { updatedBy: WORKER },
  createMovedPackageAnon: { updatedBy: WORKER },
  createAnon: {},
  createAnonForKey: {},
  createJdoeForAnon: jdoePending(),
  createRace: jdoePending(),
  updateOwn: jdoePending(),
  updateOnDraft: { createdBy: usernameIdpOf('jdoe'), formSubmissionId: ids.submissions.draft },
  updateAsmithOwn: asmithPending(),
  updateAsmithPending: asmithPending(),
  updateCopied: { createdBy: usernameIdpOf('jdoe'), formSubmissionId: ids.submissions.old },
  updatePackage: { createdBy: WORKER },
  updateUppercase: jdoePending(),
  updateRace: jdoePending(),
  packageOwn: { createdBy: usernameIdpOf('jdoe'), formSubmissionId: ids.submissions.draft },
  packageSameForm: { createdBy: usernameIdpOf('jdoe'), formSubmissionId: ids.submissions.old },
  packageOtherForm: { formSubmissionId: ids.submissions.pubOld },
  packagePending: jdoePending(),
};
const F = Object.fromEntries(Object.keys(FILE_ROWS).map((key) => [key, uuid.v4()]));

let knex;
let formsRequest;
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
    ['jdoe', 'asmith'].map((key) => ({
      id: ids.users[key],
      idpUserId: ids.guids[key],
      keycloakId: ids.guids[key],
      username: usernameOf(key),
      fullName: key,
      email: `${key}@example.com`,
      idpCode: 'idir',
      createdBy: TAG,
    }))
  );

  const forms = [
    { key: 'idir', idp: 'idir' },
    { key: 'pub', idp: 'public' },
  ];
  await knex('form').insert(forms.map((f) => ({ id: ids.forms[f.key], name: `${TAG}-${f.key}`, createdBy: TAG })));
  await knex('form_identity_provider').insert(forms.map((f) => ({ id: uuid.v4(), formId: ids.forms[f.key], code: f.idp, createdBy: TAG })));
  await knex('form_version').insert(
    forms.map((f) => ({ id: ids.versions[f.key], formId: ids.forms[f.key], version: 1, published: true, schema: JSON.stringify({ components: [] }), createdBy: TAG }))
  );
  await knex('form_role_user').insert(['jdoe', 'asmith'].map((key) => ({ id: uuid.v4(), role: 'form_submitter', formId: ids.forms.idir, userId: ids.users[key], createdBy: TAG })));
  await knex('form_api_key').insert({ formId: ids.forms.pub, secret: pubSecret, filesApiAccess: true, createdBy: TAG });

  // jdoe's earlier submission, which holds the files a copy names, and a draft
  // that jdoe and asmith (a team submitter) can both update.
  await knex('form_submission').insert([
    { id: ids.submissions.old, formVersionId: ids.versions.idir, confirmationId: `${TAG}-old`, submission: JSON.stringify({ data: {} }), createdBy: TAG },
    { id: ids.submissions.draft, formVersionId: ids.versions.idir, confirmationId: `${TAG}-draft`, draft: true, submission: JSON.stringify({ data: {} }), createdBy: TAG },
    { id: ids.submissions.pubOld, formVersionId: ids.versions.pub, confirmationId: `${TAG}-pubOld`, submission: JSON.stringify({ data: {} }), createdBy: TAG },
  ]);
  const permissions = (submissionId, userKey, list) =>
    list.map((permission) => ({ id: uuid.v4(), formSubmissionId: submissionId, userId: ids.users[userKey], permission, createdBy: TAG }));
  await knex('form_submission_user').insert([
    ...permissions(ids.submissions.old, 'jdoe', ['submission_create', 'submission_read']),
    ...permissions(ids.submissions.draft, 'jdoe', ['submission_create', 'submission_read', 'submission_update', 'submission_delete']),
    ...permissions(ids.submissions.draft, 'asmith', ['submission_read', 'submission_update']),
  ]);

  await knex('file_storage').insert(Object.entries(FILE_ROWS).map(([key, extra]) => fileRow(F[key], extra)));
};

// Removes this run's rows (or, with PREFIX, any run's). Each step runs even if
// an earlier one fails, and the failures are reported together.
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

  let formIds = [];
  let versionIds = [];
  let submissionIds = [];
  await step(async () => {
    formIds = (await knex('form').select('id').where('createdBy', 'like', like)).map((r) => r.id);
    versionIds = (await knex('form_version').select('id').whereIn('formId', formIds)).map((r) => r.id);
    submissionIds = (await knex('form_submission').select('id').whereIn('formVersionId', versionIds)).map((r) => r.id);
  });

  await step(() => knex('file_storage').where('path', 'like', `/tmp/${like}`).orWhereIn('formSubmissionId', submissionIds).del());
  await step(() => knex('form_submission_user').whereIn('formSubmissionId', submissionIds).del());
  await step(() => knex('form_submission_status').whereIn('submissionId', submissionIds).del());
  await step(() => knex('form_submission').whereIn('id', submissionIds).del());
  await step(() => knex('form_submission_audit').whereIn('submissionId', submissionIds).del());
  await step(() => knex('form_api_key').whereIn('formId', formIds).del());
  await step(() => knex('form_api_key_audit').whereIn('formId', formIds).del());
  await step(() => knex('form_role_user').whereIn('formId', formIds).del());
  await step(() => knex('form_identity_provider').whereIn('formId', formIds).del());
  await step(() => knex('form_version').whereIn('id', versionIds).del());
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
  // Object store: moves keep the file under this run's path prefix.
  jest.spyOn(storageService, 'move').mockImplementation(async (fileStorage) => `/tmp/${TAG}/moved/${fileStorage.id}`);
  jest.spyOn(storageService, 'delete').mockResolvedValue(true);
  // The post-create relocation to permanent storage, which runs after the
  // response and would otherwise race the next test.
  jest.spyOn(fileService, 'moveSubmissionFiles').mockResolvedValue();
  // Outbound notifications.
  jest.spyOn(eventService, 'formSubmissionEventReceived').mockResolvedValue();
  jest.spyOn(eventStreamService, 'onSubmit').mockResolvedValue();
  jest.spyOn(emailService, 'submissionReceived').mockResolvedValue();
  jest.spyOn(submitToEmailJobService, 'enqueueForSubmission').mockResolvedValue(null);

  formsRequest = request(expressHelper('/forms', require('../../../../src/forms/form/routes')));
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

const fileRef = (id) => ({ storage: 'chefs', url: `/app/api/v1/files/${id}`, size: 10, data: { id }, originalName: 'a.txt' });
const body = (fileIds, draft = false) => ({ draft, submission: { data: { simplefile: fileIds.map(fileRef), submit: !draft } } });

const create = (formKey, fileIds, { token, basic, draft } = {}) => {
  let req = formsRequest.post(`/forms/${ids.forms[formKey]}/versions/${ids.versions[formKey]}/submissions`).send(body(fileIds, draft));
  if (token) req = req.set('Authorization', `Bearer ${token}`);
  if (basic) req = req.set('Authorization', basic);
  return req;
};
const saveDraft = (fileIds, token) => submissionsRequest.put(`/submissions/${ids.submissions.draft}`).set('Authorization', `Bearer ${token}`).send(body(fileIds, true));

const submissionOf = async (fileId) => (await knex('file_storage').select('formSubmissionId').where('id', fileId).first())?.formSubmissionId ?? null;
const submissionCount = async () => Number((await knex('form_submission').count('id as n').whereIn('formVersionId', Object.values(ids.versions)).first()).n);
const draftData = async () => (await knex('form_submission').select('submission').where('id', ids.submissions.draft).first()).submission;
const pubKey = () => `Basic ${Buffer.from([ids.forms.pub, pubSecret].join(':')).toString('base64')}`;

const expectRejected = (response) => {
  expect(response.status).toBe(400);
  expect(response.body.detail).toBe(FILE_LINK_REJECTED);
};

// How many queries are waiting on a lock, polled until there is one or the
// tries run out.
const waitForBlockedQuery = async (triesLeft = 100) => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  const blocked = (await knex.raw('select count(*)::int as n from pg_locks where not granted')).rows[0].n;
  return blocked > 0 || triesLeft <= 1 ? blocked : waitForBlockedQuery(triesLeft - 1);
};

// Attaches the file to jdoe's earlier submission in an open transaction,
// starts the save, waits until the save's claim is blocked on that row, then
// commits: the save read the file as pending, and its claim then finds it
// attached and fails.
const raceFor = async (fileId, send) => {
  const trx = await knex.transaction();
  try {
    await trx('file_storage').where('id', fileId).update({ formSubmissionId: ids.submissions.old });
    const pending = send().then((response) => response);
    expect(await waitForBlockedQuery()).toBeGreaterThan(0);
    await trx.commit();
    return await pending;
  } catch (error) {
    if (!trx.isCompleted()) await trx.rollback();
    throw error;
  }
};

describe('linking files when a submission is created', () => {
  it('links the submitter own pending upload', async () => {
    const response = await create('idir', [F.createOwn], { token: 'jdoe', draft: true });

    expect(response.status).toBe(201);
    expect(await submissionOf(F.createOwn)).toBe(response.body.id);
  });

  it('rejects another user pending upload, and saves nothing', async () => {
    const before = await submissionCount();

    expectRejected(await create('idir', [F.createAsmith], { token: 'jdoe', draft: true }));
    expect(await submissionOf(F.createAsmith)).toBeNull();
    expect(await submissionCount()).toBe(before);
  });

  it('leaves a file on another submission where it is (copying a submission)', async () => {
    const response = await create('idir', [F.createCopied], { token: 'jdoe', draft: true });

    expect(response.status).toBe(201);
    expect(await submissionOf(F.createCopied)).toBe(ids.submissions.old);
  });

  it('rejects a package file, and one the package worker moved', async () => {
    expectRejected(await create('idir', [F.createPackage], { token: 'jdoe', draft: true }));
    expectRejected(await create('idir', [F.createMovedPackageSignedIn], { token: 'jdoe', draft: true }));
    expect(await submissionOf(F.createPackage)).toBeNull();
    expect(await submissionOf(F.createMovedPackageSignedIn)).toBeNull();
  });

  it('rejects a moved package for an anonymous submitter, whose uploads share its createdBy', async () => {
    expectRejected(await create('pub', [F.createMovedPackageAnon]));
    expect(await submissionOf(F.createMovedPackageAnon)).toBeNull();
  });

  it('ignores an id that is not a file', async () => {
    const response = await create('idir', [uuid.v4()], { token: 'jdoe', draft: true });

    expect(response.status).toBe(201);
  });

  it('links an anonymous upload for an anonymous submitter', async () => {
    const response = await create('pub', [F.createAnon]);

    expect(response.status).toBe(201);
    expect(await submissionOf(F.createAnon)).toBe(response.body.id);
  });

  it('links an anonymous upload for a form API key submitter', async () => {
    const response = await create('pub', [F.createAnonForKey], { basic: pubKey() });

    expect(response.status).toBe(201);
    expect(await submissionOf(F.createAnonForKey)).toBe(response.body.id);
  });

  it('rejects a signed-in user pending upload for an anonymous submitter', async () => {
    expectRejected(await create('pub', [F.createJdoeForAnon]));
    expect(await submissionOf(F.createJdoeForAnon)).toBeNull();
  });

  it('409s, and saves nothing, when another save takes the file first', async () => {
    const before = await submissionCount();

    const response = await raceFor(F.createRace, () => create('idir', [F.createRace], { token: 'jdoe', draft: true }));

    expect(response.status).toBe(409);
    expect(await submissionOf(F.createRace)).toBe(ids.submissions.old);
    expect(await submissionCount()).toBe(before);
  });
});

describe('linking files when a draft is saved', () => {
  it('moves the submitter own pending upload onto the draft', async () => {
    const response = await saveDraft([F.updateOwn], 'jdoe');

    expect(response.status).toBe(200);
    expect(await submissionOf(F.updateOwn)).toBe(ids.submissions.draft);
  });

  it('lets a second team submitter add their own upload beside a file already on the draft', async () => {
    const response = await saveDraft([F.updateOnDraft, F.updateAsmithOwn], 'asmith');

    expect(response.status).toBe(200);
    expect(await submissionOf(F.updateOnDraft)).toBe(ids.submissions.draft);
    expect(await submissionOf(F.updateAsmithOwn)).toBe(ids.submissions.draft);
  });

  it('rejects another user pending upload, and leaves the draft as it was', async () => {
    const before = await draftData();

    expectRejected(await saveDraft([F.updateOnDraft, F.updateAsmithPending], 'jdoe'));
    expect(await submissionOf(F.updateAsmithPending)).toBeNull();
    expect(await draftData()).toEqual(before);
  });

  it('leaves a file on another submission where it is', async () => {
    const response = await saveDraft([F.updateCopied], 'jdoe');

    expect(response.status).toBe(200);
    expect(await submissionOf(F.updateCopied)).toBe(ids.submissions.old);
  });

  it('rejects a package file', async () => {
    expectRejected(await saveDraft([F.updatePackage], 'jdoe'));
    expect(await submissionOf(F.updatePackage)).toBeNull();
  });

  it('ignores an id that is not a file, as a copy names after its source is deleted', async () => {
    const response = await saveDraft([uuid.v4()], 'jdoe');

    expect(response.status).toBe(200);
  });

  it('treats an uppercase id as the file it names', async () => {
    const response = await saveDraft([F.updateUppercase.toUpperCase(), F.updateUppercase], 'jdoe');

    expect(response.status).toBe(200);
    expect(await submissionOf(F.updateUppercase)).toBe(ids.submissions.draft);
  });

  it('409s, and leaves the draft as it was, when another save takes the file first', async () => {
    const before = await draftData();

    const response = await raceFor(F.updateRace, () => saveDraft([F.updateRace], 'jdoe'));

    expect(response.status).toBe(409);
    expect(await submissionOf(F.updateRace)).toBe(ids.submissions.old);
    expect(await draftData()).toEqual(before);
  });
});

describe('choosing the files that go into a submission package', () => {
  it('takes files on the submission and on another submission of the same form, and nothing else', async () => {
    const named = [F.packageOwn, F.packageSameForm, F.packageOtherForm, F.packagePending, uuid.v4()].map((id) => ({ id }));
    const composite = { submission: { id: ids.submissions.draft }, form: { id: ids.forms.idir } };

    const packageable = await packageBuilder._packageableFileIds(named, composite);

    expect([...packageable].sort()).toEqual([F.packageOwn, F.packageSameForm].sort());
  });
});
