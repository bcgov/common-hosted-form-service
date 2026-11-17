const express = require('express');
const request = require('supertest');
const uuid = require('uuid');

//
// File uploads through the real router and middleware chain: the upload rate
// limit (both stages), currentUser, hasFileCreate, virusScan, the controller,
// fileService.create (with its name checks) and the app's errorHandler and
// finalErrorHandler all run for real. Only I/O edges are stubbed: JWT
// signature verification, the identity provider list, the user upsert and
// login history, the form lookup, multer's disk write, ClamAV, the file_storage
// model, the object store and temp-file removal.
//
// The router is loaded once with small limits and a short scan wait and
// deadline (settings layered over the real config), so the tests are quick and
// do not depend on env settings. Limiter counts live for the whole file, so
// every test uses its own client address or user.
//
const SETTINGS = {
  'server.rateLimit.fileUpload.limitIp': '3',
  'server.rateLimit.fileUpload.dailyLimitIp': '50',
  'server.rateLimit.fileUpload.limitRestrictedUser': '4',
  'server.rateLimit.fileUpload.dailyLimitRestrictedUser': '50',
  'server.rateLimit.fileUpload.limitUser': '6',
  'server.rateLimit.fileUpload.dailyLimitUser': '50',
  'files.clamav.maxConcurrentScans': '1',
  'files.clamav.maxWaitingScans': '1',
  'files.clamav.scanSlotWaitMs': '300',
  'files.clamav.scanTimeoutMs': '300',
};
const IP_LIMIT = 3;
const RESTRICTED_USER_LIMIT = 4;
const USER_LIMIT = 6;

const load = () => {
  let loaded;
  jest.isolateModules(() => {
    const realConfig = jest.requireActual('config');
    jest.doMock('config', () => ({
      ...realConfig,
      has: (path) => Object.hasOwn(SETTINGS, path) || realConfig.has(path),
      get: (path) => (Object.hasOwn(SETTINGS, path) ? SETTINGS[path] : realConfig.get(path)),
      util: realConfig.util,
    }));

    // multer's disk write is the I/O edge; set before the router captures it.
    const upload = require('../../../../src/forms/file/middleware/upload');
    upload.fileUpload.upload = jest.fn((req, _res, next) => {
      req.file = { path: `/tmp/none/${uuid.v4()}`, originalname: req.headers['x-test-filename'] || 'a.txt', mimetype: 'text/plain', size: 1 };
      next();
    });

    loaded = {
      upload,
      router: require('../../../../src/forms/file/routes'),
      middleware: require('../../../../src/forms/common/middleware'),
      authService: require('../../../../src/forms/auth/service'),
      formService: require('../../../../src/forms/form/service'),
      models: require('../../../../src/forms/common/models'),
      storageService: require('../../../../src/forms/file/storage/storageService'),
      uploadCleanup: require('../../../../src/forms/file/uploadCleanup'),
      virusScan: require('../../../../src/forms/file/middleware/virusScan'),
      clamAvScanner: require('../../../../src/components/clamAvScanner'),
      idpService: require('../../../../src/components/idpService'),
      jwtService: require('../../../../src/components/jwtService'),
      // jwtService checks errors against this registry's jose classes.
      jose: require('jose'),
    };
  });
  jest.dontMock('config');
  return loaded;
};

const ctx = load();

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use('/files', ctx.router);
app.use(ctx.middleware.errorHandler);
app.use(
  ctx.middleware.finalErrorHandler({
    dataConnection: { resetConnection: jest.fn() },
    statusService: { getStatus: () => ({ stopped: false }) },
    log: { error: jest.fn() },
  })
);
const appRequest = request(app);

const publicFormId = uuid.v4();

const PROVIDERS = [
  { code: 'public', idp: 'public', active: true, login: false, tokenmap: null, extra: {} },
  {
    code: 'idir',
    idp: 'idir',
    active: true,
    login: true,
    tokenmap: { idpUserId: 'idir_user_guid', keycloakId: 'idir_user_guid', username: 'idir_username', idp: 'identity_provider' },
    extra: {},
  },
  {
    code: 'bceid-basic',
    idp: 'bceidbasic',
    active: true,
    login: true,
    tokenmap: { idpUserId: 'bceid_user_guid', keycloakId: 'bceid_user_guid', username: 'bceid_username', idp: 'identity_provider' },
    extra: { restrictFileDownloads: true },
  },
];

const TOKENS = {
  'idir-a': { identity_provider: 'idir', idir_user_guid: uuid.v4(), idir_username: 'a' },
  'idir-b': { identity_provider: 'idir', idir_user_guid: uuid.v4(), idir_username: 'b' },
  'idir-c': { identity_provider: 'idir', idir_user_guid: uuid.v4(), idir_username: 'c' },
  'basic-a': { identity_provider: 'bceidbasic', bceid_user_guid: uuid.v4(), bceid_username: 'basica' },
  'basic-b': { identity_provider: 'bceidbasic', bceid_user_guid: uuid.v4(), bceid_username: 'basicb' },
};
const USER_IDS = Object.fromEntries(Object.keys(TOKENS).map((t) => [t, uuid.v4()]));

const fileRow = (id) => ({ id, originalName: 'a.txt', size: 1, createdBy: 'x', createdAt: 'now' });

beforeEach(() => {
  jest.spyOn(ctx.idpService, 'getIdentityProviders').mockResolvedValue(PROVIDERS);
  jest.spyOn(ctx.jwtService, '_verify').mockImplementation(async (token) => {
    if (!TOKENS[token]) throw new ctx.jose.errors.JWTInvalid('invalid token');
    return TOKENS[token];
  });
  jest.spyOn(ctx.authService, 'getUserId').mockImplementation(async (userInfo) => {
    if (userInfo.public) return { id: 'public', ...userInfo };
    const token = Object.keys(TOKENS).find((t) => (TOKENS[t].idir_user_guid || TOKENS[t].bceid_user_guid) === userInfo.idpUserId);
    return { id: USER_IDS[token], ...userInfo };
  });
  jest.spyOn(ctx.authService, 'recordLoginHistory').mockResolvedValue();
  jest.spyOn(ctx.formService, 'readForm').mockResolvedValue({ id: publicFormId, active: true, identityProviders: [{ code: 'public' }] });
  jest.spyOn(ctx.clamAvScanner, 'scanFile').mockResolvedValue({ isInfected: false, viruses: [] });
  jest.spyOn(ctx.models.FileStorage, 'startTransaction').mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() });
  jest.spyOn(ctx.models.FileStorage, 'query').mockImplementation(() => ({
    insert: async (row) => row,
    findById: (id) => ({ throwIfNotFound: async () => fileRow(id) }),
  }));
  jest.spyOn(ctx.storageService, 'upload').mockImplementation(async (row) => ({ path: `key/uploads/${row.id}`, storage: 'objectStorage' }));
  jest.spyOn(ctx.uploadCleanup, 'removeUploadedFile').mockResolvedValue(true);
});

afterEach(() => {
  jest.restoreAllMocks();
  ctx.upload.fileUpload.upload.mockClear();
});

const post = ({ xff, token, filename } = {}) => {
  let req = appRequest.post(`/files?formId=${publicFormId}`).set('X-Forwarded-For', xff);
  if (token) req = req.set('Authorization', `Bearer ${token}`);
  if (filename) req = req.set('X-Test-Filename', filename);
  return req;
};

const sendMany = async (count, options) => {
  const statuses = [];
  for (let i = 0; i < count; i += 1) {
    statuses.push((await post(options)).status);
  }
  return statuses;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Holds every scan slot for the duration of fn.
const withScanSlotsHeld = async (fn) => {
  const { scanSlots } = ctx.virusScan;
  expect(scanSlots.active).toBe(0);
  for (let i = 0; i < scanSlots.max; i += 1) await scanSlots.acquire();
  try {
    return await fn();
  } finally {
    while (scanSlots.waiting > 0 || scanSlots.active > 0) scanSlots.release();
  }
};

describe('POST /files upload rate limit', () => {
  it('refuses the anonymous upload over the limit before sign-in, form, upload and scan work', async () => {
    const statuses = await sendMany(IP_LIMIT, { xff: '198.51.100.1' });
    jest.clearAllMocks();

    const response = await post({ xff: '198.51.100.1' });

    expect(statuses).toEqual(new Array(IP_LIMIT).fill(201));
    expect(response.status).toBe(429);
    expect(response.body.detail).toBe('Too many file uploads. Please try again later.');
    expect(response.headers['retry-after']).toBeDefined();
    expect(response.headers.ratelimit).toMatch(/remaining=0/);
    expect(ctx.authService.getUserId).not.toBeCalled();
    expect(ctx.formService.readForm).not.toBeCalled();
    expect(ctx.upload.fileUpload.upload).not.toBeCalled();
    expect(ctx.clamAvScanner.scanFile).not.toBeCalled();
  });

  it('ignores a spoofed address in front of the client address', async () => {
    await sendMany(IP_LIMIT, { xff: '198.51.100.2' });

    expect((await post({ xff: '203.0.113.9, 198.51.100.2' })).status).toBe(429);
  });

  it('counts each address separately', async () => {
    await sendMany(IP_LIMIT, { xff: '198.51.100.3' });

    expect((await post({ xff: '198.51.100.4' })).status).toBe(201);
  });

  it('counts an IPv6 /64 as one address', async () => {
    await sendMany(IP_LIMIT, { xff: '2001:db8:aa:1::1' });

    expect((await post({ xff: '2001:db8:aa:1:ffff::2' })).status).toBe(429);
    expect((await post({ xff: '2001:db8:aa:2::1' })).status).toBe(201);
  });

  it('counts IPv4-mapped addresses as their IPv4 address', async () => {
    await sendMany(IP_LIMIT - 1, { xff: '198.51.100.5' });
    await post({ xff: '0:0:0:0:0:ffff:198.51.100.5' });

    expect((await post({ xff: '::ffff:198.51.100.5' })).status).toBe(429);
  });

  it('counts signed-in users by user, before the form check and upload', async () => {
    const statuses = await sendMany(USER_LIMIT, { xff: '198.51.100.6', token: 'idir-a' });
    jest.clearAllMocks();

    const refused = await post({ xff: '198.51.100.6', token: 'idir-a' });

    expect(statuses).toEqual(new Array(USER_LIMIT).fill(201));
    expect(refused.status).toBe(429);
    expect(ctx.formService.readForm).not.toBeCalled();
    expect(ctx.upload.fileUpload.upload).not.toBeCalled();
    expect((await post({ xff: '198.51.100.6', token: 'idir-b' })).status).toBe(201);
    expect((await post({ xff: '198.51.100.6' })).status).toBe(201);
  });

  it('counts Basic BCeID users by user, with the lower restricted-user limit', async () => {
    const statuses = await sendMany(RESTRICTED_USER_LIMIT, { xff: '198.51.100.7', token: 'basic-a' });

    expect(statuses).toEqual(new Array(RESTRICTED_USER_LIMIT).fill(201));
    expect((await post({ xff: '198.51.100.7', token: 'basic-a' })).status).toBe(429);
    expect((await post({ xff: '198.51.100.7', token: 'basic-b' })).status).toBe(201);
  });

  it('refuses an invalid Bearer token with 401 before the upload', async () => {
    expect((await post({ xff: '198.51.100.8', token: 'not-a-known-token' })).status).toBe(401);
    expect(ctx.upload.fileUpload.upload).not.toBeCalled();
  });
});

describe('POST /files name checks', () => {
  it('refuses a blocked extension with 415 before scanning', async () => {
    const response = await post({ xff: '198.51.100.20', filename: 'run.exe' });

    expect(response.status).toBe(415);
    expect(response.body.detail).toBe('File type .exe is not allowed for security reasons');
    expect(ctx.clamAvScanner.scanFile).not.toBeCalled();
    expect(ctx.uploadCleanup.removeUploadedFile).toBeCalledWith(expect.any(String), 'invalid-name');
  });

  it('refuses a path separator in the name with 400 before scanning', async () => {
    const response = await post({ xff: '198.51.100.21', filename: 'dir/a.txt' });

    expect(response.status).toBe(400);
    expect(ctx.clamAvScanner.scanFile).not.toBeCalled();
  });

  it('accepts ".." inside a name', async () => {
    expect((await post({ xff: '198.51.100.22', filename: 'report..final.pdf' })).status).toBe(201);
  });
});

describe('POST /files scanning', () => {
  it('returns 503 with Retry-After when no scan slot frees up, and refunds the upload', async () => {
    const busy = await withScanSlotsHeld(() => sendMany(IP_LIMIT, { xff: '198.51.100.30' }));
    const after = await sendMany(IP_LIMIT + 1, { xff: '198.51.100.30' });

    expect(busy).toEqual(new Array(IP_LIMIT).fill(503));
    expect(after).toEqual([...new Array(IP_LIMIT).fill(201), 429]);
    expect(ctx.uploadCleanup.removeUploadedFile).toBeCalledWith(expect.any(String), 'scan-busy');
  });

  it('sends Retry-After with the busy 503', async () => {
    const response = await withScanSlotsHeld(() => post({ xff: '198.51.100.31' }));

    expect(response.status).toBe(503);
    expect(response.body.detail).toBe('File scanning is busy. Please try again shortly.');
    expect(response.headers['retry-after']).toBe(String(Math.ceil(ctx.virusScan.scanSlots.waitMs / 1000)));
  });

  it('returns 503 at once when the wait queue is full', async () => {
    await withScanSlotsHeld(async () => {
      const waitingRequest = post({ xff: '198.51.100.32' }).then((r) => r);
      while (ctx.virusScan.scanSlots.waiting < ctx.virusScan.scanSlots.maxWaiting) await sleep(10);

      const started = Date.now();
      const response = await post({ xff: '198.51.100.33' });

      expect(response.status).toBe(503);
      expect(Date.now() - started).toBeLessThan(ctx.virusScan.scanSlots.waitMs);
      await waitingRequest;
    });
  });

  it('returns 503 when the scan fails, and refunds the upload', async () => {
    ctx.clamAvScanner.scanFile.mockRejectedValue(new Error('clamd unreachable'));

    const failed = await sendMany(IP_LIMIT, { xff: '198.51.100.34' });
    ctx.clamAvScanner.scanFile.mockResolvedValue({ isInfected: false, viruses: [] });
    const after = await sendMany(IP_LIMIT + 1, { xff: '198.51.100.34' });

    expect(failed).toEqual(new Array(IP_LIMIT).fill(503));
    expect(after).toEqual([...new Array(IP_LIMIT).fill(201), 429]);
  });

  it('returns 503 for an inconclusive scan instead of storing the file', async () => {
    ctx.clamAvScanner.scanFile.mockResolvedValue({ isInfected: null, viruses: [] });

    const response = await post({ xff: '198.51.100.35' });

    expect(response.status).toBe(503);
    expect(response.body.detail).toBe('Unable to scan the file at this time. Please try again later.');
    expect(ctx.storageService.upload).not.toBeCalled();
  });

  it('returns 503 when the scan passes its deadline, and frees the slot', async () => {
    ctx.clamAvScanner.scanFile.mockImplementation(() => new Promise(() => {}));

    const response = await post({ xff: '198.51.100.36' });

    expect(response.status).toBe(503);
    expect(ctx.virusScan.scanSlots.active).toBe(0);
  });

  it('returns 409 for an infected file', async () => {
    ctx.clamAvScanner.scanFile.mockResolvedValue({ isInfected: true, viruses: ['Eicar-Test-Signature'] });

    const response = await post({ xff: '198.51.100.37' });

    expect(response.status).toBe(409);
    expect(ctx.storageService.upload).not.toBeCalled();
  });
});
