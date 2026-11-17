const express = require('express');
const request = require('supertest');
const uuid = require('uuid');

const { ipKey } = require('../../../../../src/forms/file/middleware/uploadRateLimit');

//
// The limiter reads its settings when the module loads, so these tests load a
// fresh copy with test settings layered over the real config. The limiters are
// the real express-rate-limit ones on a small app with trust proxy 1.
//
const SETTING_PREFIX = 'server.rateLimit.fileUpload.';

const loadWith = (settings) => {
  const overrides = Object.fromEntries(Object.entries(settings).map(([key, value]) => [`${SETTING_PREFIX}${key}`, value]));
  let loaded;
  jest.isolateModules(() => {
    const realConfig = jest.requireActual('config');
    jest.doMock('config', () => ({
      ...realConfig,
      has: (path) => Object.hasOwn(overrides, path) || realConfig.has(path),
      get: (path) => (Object.hasOwn(overrides, path) ? overrides[path] : realConfig.get(path)),
      util: realConfig.util,
    }));
    loaded = {
      limiter: require('../../../../../src/forms/file/middleware/uploadRateLimit'),
      idpService: require('../../../../../src/components/idpService'),
    };
  });
  jest.dontMock('config');
  return loaded;
};

const appFor = ({ limiter }, { user, handler } = {}) => {
  const app = express();
  app.set('trust proxy', 1);
  app.post(
    '/',
    limiter.limitAnonymousUploads,
    (req, _res, next) => {
      if (user) req.currentUser = user;
      next();
    },
    limiter.limitSignedInUploads,
    handler || ((_req, res) => res.sendStatus(201))
  );
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => (err.send ? err.send(res) : res.sendStatus(500)));
  return request(app);
};

const statusesOf = async (agent, count, { xff, bearer } = {}) => {
  const statuses = [];
  for (let i = 0; i < count; i += 1) {
    let req = agent.post('/').set('X-Forwarded-For', xff);
    if (bearer) req = req.set('Authorization', 'Bearer token');
    statuses.push((await req).status);
  }
  return statuses;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const signedIn = (idp) => ({ id: uuid.v4(), idpUserId: uuid.v4(), idp });

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ipKey', () => {
  test.each([
    ['198.51.100.1', 'ip:198.51.100.1'],
    ['::ffff:198.51.100.1', 'ip:198.51.100.1'],
    ['::FFFF:198.51.100.1', 'ip:198.51.100.1'],
    ['0:0:0:0:0:ffff:198.51.100.1', 'ip:198.51.100.1'],
    ['::ffff:c633:6401', 'ip:198.51.100.1'],
    ['::198.51.100.1', 'ip6:0000:0000:0000:0000/64'],
    ['2001:db8:aa:1::1', 'ip6:2001:0db8:00aa:0001/64'],
    ['2001:db8:aa:1:ffff:ffff:ffff:ffff', 'ip6:2001:0db8:00aa:0001/64'],
    ['2001:db8::1', 'ip6:2001:0db8:0000:0000/64'],
    ['::1', 'ip6:0000:0000:0000:0000/64'],
    ['fe80::1%eth0', 'ip6:fe80:0000:0000:0000/64'],
    ['64:ff9b::192.0.2.33', 'ip6:0064:ff9b:0000:0000/64'],
    [undefined, 'ip:unknown'],
  ])('%p -> %p', (ip, expected) => {
    expect(ipKey(ip)).toBe(expected);
  });
});

describe('settings', () => {
  test.each([
    ['10m', 600000],
    ['1e6', 600000],
    ['0', 600000],
    ['-5', 600000],
    ['99999999999', 600000],
    [' 1200 ', 1200],
  ])('windowMs %p is read as %p', (value, expected) => {
    expect(loadWith({ windowMs: value }).limiter.settings.windowMs).toBe(expected);
  });

  test.each([
    ['false', false],
    ['FALSE', false],
    ['true', true],
    ['0', true],
  ])('enabled %p is read as %p', (value, expected) => {
    expect(loadWith({ enabled: value }).limiter.settings.enabled).toBe(expected);
  });

  it('uses the built-in limits when no settings are configured', () => {
    const { settings } = loadWith({}).limiter;

    expect(settings).toEqual(expect.objectContaining({ limitIp: expect.any(Number), limitRestrictedUser: expect.any(Number), limitUser: expect.any(Number) }));
  });
});

describe('upload rate limit', () => {
  it('refuses on the daily window once the burst window has reset', async () => {
    const agent = appFor(loadWith({ windowMs: '1000', limitIp: '2', dailyLimitIp: '3' }));

    const first = await statusesOf(agent, 3, { xff: '198.51.100.20' });
    await sleep(1100);
    const second = await statusesOf(agent, 2, { xff: '198.51.100.20' });

    expect(first).toEqual([201, 201, 429]);
    expect(second).toEqual([201, 429]);
  });

  it('sends Retry-After when the daily window refuses', async () => {
    const agent = appFor(loadWith({ limitIp: '5', dailyLimitIp: '1' }));
    await statusesOf(agent, 1, { xff: '198.51.100.21' });

    const response = await agent.post('/').set('X-Forwarded-For', '198.51.100.21');

    expect(response.status).toBe(429);
    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('honours a short daily window', async () => {
    const agent = appFor(loadWith({ limitIp: '5', dailyLimitIp: '1', dailyWindowMs: '1000' }));

    const first = await statusesOf(agent, 2, { xff: '198.51.100.22' });
    await sleep(1100);
    const second = await statusesOf(agent, 1, { xff: '198.51.100.22' });

    expect(first).toEqual([201, 429]);
    expect(second).toEqual([201]);
  });

  it('passes everything through when disabled, signed in or not', async () => {
    const loaded = loadWith({ enabled: 'false', limitIp: '1', limitUser: '1', limitRestrictedUser: '1' });
    jest.spyOn(loaded.idpService, 'findByCode').mockResolvedValue({ code: 'idir', extra: {} });

    expect(await statusesOf(appFor(loaded), 3, { xff: '198.51.100.23' })).toEqual([201, 201, 201]);
    expect(await statusesOf(appFor(loaded, { user: signedIn('idir') }), 3, { xff: '198.51.100.23', bearer: true })).toEqual([201, 201, 201]);
  });

  it('gives a signed-in user whose provider is not found the restricted-user limit', async () => {
    const loaded = loadWith({ limitRestrictedUser: '2', limitUser: '50' });
    jest.spyOn(loaded.idpService, 'findByCode').mockResolvedValue(undefined);
    const agent = appFor(loaded, { user: signedIn('unknown') });

    expect(await statusesOf(agent, 3, { xff: '198.51.100.24', bearer: true })).toEqual([201, 201, 429]);
  });

  it('gives a flagged provider the restricted-user limits and others the user limits', async () => {
    const loaded = loadWith({ limitRestrictedUser: '1', limitUser: '3' });
    jest.spyOn(loaded.idpService, 'findByCode').mockImplementation(async (code) => ({ code, extra: { restrictFileDownloads: code === 'bceid-basic' } }));

    const basic = appFor(loaded, { user: signedIn('bceid-basic') });
    const idir = appFor(loaded, { user: signedIn('idir') });

    expect(await statusesOf(basic, 2, { xff: '198.51.100.25', bearer: true })).toEqual([201, 429]);
    expect(await statusesOf(idir, 4, { xff: '198.51.100.25', bearer: true })).toEqual([201, 201, 201, 429]);
  });

  it('applies the daily limits of both signed-in stages', async () => {
    const loaded = loadWith({ limitRestrictedUser: '50', dailyLimitRestrictedUser: '1', limitUser: '50', dailyLimitUser: '2' });
    jest.spyOn(loaded.idpService, 'findByCode').mockImplementation(async (code) => ({ code, extra: { restrictFileDownloads: code === 'bceid-basic' } }));

    expect(await statusesOf(appFor(loaded, { user: signedIn('bceid-basic') }), 2, { xff: '198.51.100.26', bearer: true })).toEqual([201, 429]);
    expect(await statusesOf(appFor(loaded, { user: signedIn('idir') }), 3, { xff: '198.51.100.26', bearer: true })).toEqual([201, 201, 429]);
  });

  it('counts a Bearer request with no signed-in user by address', async () => {
    const agent = appFor(loadWith({ limitIp: '1' }), { user: { id: 'public', idp: 'public' } });

    expect(await statusesOf(agent, 2, { xff: '198.51.100.27', bearer: true })).toEqual([201, 429]);
  });

  it('passes on a provider lookup error', async () => {
    const loaded = loadWith({});
    jest.spyOn(loaded.idpService, 'findByCode').mockRejectedValue(new Error('lookup failed'));

    expect(await statusesOf(appFor(loaded, { user: signedIn('idir') }), 1, { xff: '198.51.100.28', bearer: true })).toEqual([500]);
  });

  it('gives an upload back when the request is refunded', async () => {
    const handler = async (req, res) => {
      await req.uploadRateLimitRefund();
      res.sendStatus(201);
    };
    const agent = appFor(loadWith({ limitIp: '2' }), { handler });

    expect(await statusesOf(agent, 5, { xff: '198.51.100.29' })).toEqual([201, 201, 201, 201, 201]);
  });
});
