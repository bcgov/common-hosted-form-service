const { getMockReq, getMockRes } = require('@jest-mock/express');
const uuid = require('uuid');

const { apiKeyRateLimiter } = require('../../../../../src/forms/common/middleware');

const rateLimit = 7;
const rateWindowSeconds = 11;

jest.mock('config', () => {
  return {
    get: jest.fn((key) => {
      if (key === 'server.rateLimit.public.max') {
        return rateLimit;
      }

      if (key === 'server.rateLimit.public.windowMs') {
        return rateWindowSeconds * 1000;
      }
    }),
  };
});

// Headers for Draft 7 of the standard.
const rateLimitName = 'RateLimit';
const rateLimitValue = `limit=${rateLimit}, remaining=${rateLimit - 1}, reset=${rateWindowSeconds}`;
const rateLimitPolicyName = 'RateLimit-Policy';
const rateLimitPolicyValue = `${rateLimit};w=${rateWindowSeconds}`;

const ipAddress = '1.2.3.4';

const formId = uuid.v4();
const secret = uuid.v4();
const basicToken = Buffer.from(`${formId}:${secret}`).toString('base64');

const bearerToken = Math.random().toString(36).substring(2);

beforeEach(() => {
  // Reset the rate limiting to be able to call the rate limiter multiple times
  apiKeyRateLimiter.resetKey(ipAddress);
});

describe('apiKeyRateLimiter', () => {
  it('rate limits basic auth', async () => {
    const req = getMockReq({
      headers: {
        authorization: 'Basic ' + basicToken,
      },
      ip: ipAddress,
    });
    req.app.get = jest.fn().mockReturnValue();
    const { res, next } = getMockRes();

    await apiKeyRateLimiter(req, res, next);

    expect(res.setHeader).toBeCalledTimes(2);
    // These also test that the rate limiter uses our custom config values.
    expect(res.setHeader).toHaveBeenNthCalledWith(1, rateLimitPolicyName, rateLimitPolicyValue);
    expect(res.setHeader).toHaveBeenNthCalledWith(2, rateLimitName, rateLimitValue);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith();
  });

  describe('skips rate limiting for', () => {
    test('no headers', async () => {
      const req = getMockReq({
        ip: ipAddress,
      });
      req.app.get = jest.fn().mockReturnValue();
      const { res, next } = getMockRes();

      await apiKeyRateLimiter(req, res, next);

      expect(res.setHeader).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('no authorization header', async () => {
      const req = getMockReq({
        headers: {},
        ip: ipAddress,
      });
      req.app.get = jest.fn().mockReturnValue();
      const { res, next } = getMockRes();

      await apiKeyRateLimiter(req, res, next);

      expect(res.setHeader).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('empty authorization header', async () => {
      const req = getMockReq({
        headers: {
          authorization: '',
        },
        ip: ipAddress,
      });
      req.app.get = jest.fn().mockReturnValue();
      const { res, next } = getMockRes();

      await apiKeyRateLimiter(req, res, next);

      expect(res.setHeader).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('unexpected authorization type', async () => {
      const req = getMockReq({
        headers: {
          authorization: Math.random().toString(36).substring(2),
        },
        ip: ipAddress,
      });
      req.app.get = jest.fn().mockReturnValue();
      const { res, next } = getMockRes();

      await apiKeyRateLimiter(req, res, next);

      expect(res.setHeader).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('bearer auth', async () => {
      const req = getMockReq({
        headers: {
          authorization: 'Bearer ' + bearerToken,
        },
        ip: ipAddress,
      });
      req.app.get = jest.fn().mockReturnValue();
      const { res, next } = getMockRes();

      await apiKeyRateLimiter(req, res, next);

      expect(res.setHeader).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });
  });
});
