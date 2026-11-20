const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('config');
const { getMockReq, getMockRes } = require('@jest-mock/express');

const service = require('../../../../src/forms/form/service');
const authService = require('../../../../src/forms/auth/service');
const controller = require('../../../../src/forms/form/turnstile/controller');
const serviceUnderTest = require('../../../../src/forms/form/turnstile/service');
const allowance = require('../../../../src/forms/form/turnstile/allowanceService');

const formId = '343a19be-1077-4437-91fd-dc989a2b3d87';
const form = { id: formId, identityProviders: [{ code: 'idir' }, { code: 'bceid-basic' }] };

const request = (overrides = {}) =>
  getMockReq({
    params: { formId },
    currentUser: { id: 'submitter' },
    baseUrl: '/app/api/v1/forms',
    secure: true,
    ...overrides,
  });

beforeEach(() => {
  jest.spyOn(service, 'readFormIdentityProviders').mockResolvedValue(form);
  const getConfig = config.get.bind(config);
  jest
    .spyOn(config, 'get')
    .mockImplementation((key) => (key === 'turnstile' ? { siteKey: 'site-key', secretKey: 'secret-key', hostnames: 'localhost, test.example.com' } : getConfig(key)));
});

afterEach(() => jest.restoreAllMocks());

test('requires proof based on all configured providers and opens an IDIR-only form', async () => {
  const { res, next } = getMockRes();
  await controller.readStatus(request(), res, next);
  expect(res.json).toHaveBeenLastCalledWith({ verified: false, siteKey: 'site-key' });
  expect(() => serviceUnderTest.requireProof(request(), form)).toThrow(/403/);

  service.readFormIdentityProviders.mockResolvedValue({ ...form, identityProviders: [{ code: 'idir' }] });
  await controller.readStatus(request(), res, next);
  expect(res.json).toHaveBeenLastCalledWith({ verified: true });
});

test('fails closed for a public form when the widget is unconfigured', async () => {
  const { res, next } = getMockRes();
  service.readFormIdentityProviders.mockResolvedValue({ ...form, identityProviders: [{ code: 'public' }] });
  config.get.mockReturnValueOnce({ siteKey: '', secretKey: '' });

  await controller.readStatus(request({ currentUser: { public: true } }), res, next);

  expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 500 }));
  expect(res.json).not.toHaveBeenCalled();
});

test('issues and validates a signed cookie bound to the form and submitter', async () => {
  jest.spyOn(axios, 'post').mockResolvedValue({ data: { success: true, action: 'chefs_submit', hostname: 'localhost', cdata: formId } });
  const { res, next } = getMockRes();
  await controller.verifyChallenge(request({ body: { token: 'cloudflare-token' } }), res, next);

  expect(res.sendStatus).toHaveBeenCalledWith(204);
  const [name, proof, options] = res.cookie.mock.calls[0];
  expect(options).toMatchObject({ httpOnly: true, secure: true, sameSite: 'lax', maxAge: 900_000 });
  const headers = { cookie: `${name}=${proof}` };
  expect(() => serviceUnderTest.requireProof(request({ headers }), form)).not.toThrow();
  expect(() => serviceUnderTest.requireProof(request({ headers, currentUser: { id: 'other-user' } }), form)).toThrow(/403/);
  expect(() => serviceUnderTest.requireProof(request({ headers }), { ...form, id: 'other-form' })).toThrow(/403/);
  const expiredAt = Date.now() + 900_000;
  jest.spyOn(Date, 'now').mockReturnValue(expiredAt);
  expect(() => serviceUnderTest.requireProof(request({ headers }), form)).toThrow(/403/);
});

test('rejects a token that Cloudflare verified for a different form', async () => {
  jest.spyOn(axios, 'post').mockResolvedValue({ data: { success: true, action: 'chefs_submit', hostname: 'localhost', cdata: 'other-form' } });
  const { res, next } = getMockRes();
  await controller.verifyChallenge(request({ body: { token: 'cloudflare-token' } }), res, next);

  expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  expect(res.cookie).not.toHaveBeenCalled();
});

test('verifies a saved draft against its stored form and issues proof for both API routes', async () => {
  jest.spyOn(authService, 'getSubmissionForm').mockResolvedValue({ form });
  jest.spyOn(axios, 'post').mockResolvedValue({ data: { success: true, action: 'chefs_submit', hostname: 'localhost', cdata: formId } });
  const { res, next } = getMockRes();
  await controller.verifySubmissionChallenge(request({ params: { formSubmissionId: 'saved-draft' }, body: { token: 'cloudflare-token' } }), res, next);

  expect(authService.getSubmissionForm).toHaveBeenCalledWith('saved-draft');
  expect(service.readFormIdentityProviders).not.toHaveBeenCalled();
  expect(res.cookie).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.objectContaining({ path: '/app/api/v1' }));
  expect(res.sendStatus).toHaveBeenCalledWith(204);
});

test('rejects a successful Cloudflare challenge from a hostname outside this deployment', async () => {
  jest.spyOn(axios, 'post').mockResolvedValue({ data: { success: true, action: 'chefs_submit', hostname: 'other.example.com', cdata: formId } });
  const { res, next } = getMockRes();
  await controller.verifyChallenge(request({ body: { token: 'cloudflare-token' } }), res, next);

  expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  expect(res.cookie).not.toHaveBeenCalled();
});

test('keeps the form available after spending a proof and renews it for another submission', async () => {
  jest.spyOn(axios, 'post').mockResolvedValue({ data: { success: true, action: 'chefs_submit', hostname: 'localhost', cdata: formId } });
  const isSpent = jest.spyOn(allowance, 'isSpent').mockResolvedValue(true);
  const { res, next } = getMockRes();
  await controller.verifyChallenge(request({ body: { token: 'first-token' } }), res, next);
  const [name, firstProof] = res.cookie.mock.calls[0];
  const headers = { cookie: `${name}=${firstProof}` };

  await controller.readStatus(request({ headers }), res, next);
  expect(res.json).toHaveBeenLastCalledWith({ verified: true });
  expect(isSpent).not.toHaveBeenCalled();

  const renewal = { headers, query: { unused: 'true' } };
  await controller.readStatus(request(renewal), res, next);
  expect(res.json).toHaveBeenLastCalledWith({ verified: false, siteKey: 'site-key' });

  await controller.verifyChallenge(request({ ...renewal, body: { token: 'new-token' } }), res, next);
  const [, renewedProof] = res.cookie.mock.calls[1];
  expect(jwt.decode(renewedProof).jti).not.toEqual(jwt.decode(firstProof).jti);

  await controller.verifyChallenge(request({ body: { token: 'first-token' } }), res, next);
  expect(jwt.decode(res.cookie.mock.calls[2][1]).jti).toEqual(jwt.decode(firstProof).jti);
});

test('rejects unavailable or spent proof when claiming a submission transaction', async () => {
  const trx = { raw: jest.fn().mockResolvedValue({ rows: [] }) };
  await allowance.consume(trx, null);
  expect(trx.raw).not.toHaveBeenCalled();

  await expect(allowance.consume(trx, { jti: 'proof-id', exp: 123 })).rejects.toMatchObject({
    status: 403,
    code: 'TURNSTILE_REQUIRED',
  });
  expect(trx.raw).toHaveBeenCalledTimes(1);
});

test('stops the proof cleanup timer on shutdown and only starts one timer', () => {
  jest.useFakeTimers();
  try {
    allowance.startCleanup();
    allowance.startCleanup();
    expect(jest.getTimerCount()).toBe(1);
    allowance.stopCleanup();
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    allowance.stopCleanup();
    jest.useRealTimers();
  }
});
