const { getMockReq, getMockRes } = require('@jest-mock/express');
const uuid = require('uuid');

const apiAccess = require('../../../../../src/forms/public/middleware/apiAccess');

afterEach(() => {
  jest.clearAllMocks();
});

describe('checkApiKey', () => {
  process.env.APITOKEN = uuid.v4();

  describe('401 response when', () => {
    const expectedStatus = { status: 401 };

    test('there is no APITOKEN or apikey', async () => {
      const req = getMockReq();
      const { res, next } = getMockRes();

      await apiAccess.checkApiKey(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('the apikey is empty', async () => {
      const req = getMockReq({
        headers: { apikey: '' },
      });
      const { res, next } = getMockRes();

      await apiAccess.checkApiKey(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('the apikey exists but does not match', async () => {
      const req = getMockReq({
        headers: { apikey: uuid.v4() },
      });
      const { res, next } = getMockRes();

      await apiAccess.checkApiKey(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    // Regression guard: an Authorization header must NOT bypass the apikey check.
    // Previously a stray "if (req.headers.authorization) return next()" let any
    // Bearer/Basic header through these system-only routes.
    test('a Bearer Authorization header is present but no apikey', async () => {
      const req = getMockReq({
        headers: { authorization: 'Bearer some-token' },
      });
      const { res, next } = getMockRes();

      await apiAccess.checkApiKey(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('a Basic Authorization header is present but no apikey', async () => {
      const req = getMockReq({
        headers: { authorization: 'Basic Zm9vOmJhcg==' },
      });
      const { res, next } = getMockRes();

      await apiAccess.checkApiKey(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('a valid apikey is sent alongside an Authorization header but APITOKEN is not configured', async () => {
      const savedToken = process.env.APITOKEN;
      delete process.env.APITOKEN;

      const req = getMockReq({
        headers: { apikey: 'anything', authorization: 'Bearer some-token' },
      });
      const { res, next } = getMockRes();

      await apiAccess.checkApiKey(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));

      process.env.APITOKEN = savedToken;
    });
  });

  describe('allows', () => {
    test('matching APITOKEN and apikey', async () => {
      const req = getMockReq({
        headers: {
          apikey: process.env.APITOKEN,
        },
      });
      const { res, next } = getMockRes();

      await apiAccess.checkApiKey(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('matching apikey even when an Authorization header is also present', async () => {
      const req = getMockReq({
        headers: {
          apikey: process.env.APITOKEN,
          authorization: 'Bearer some-token',
        },
      });
      const { res, next } = getMockRes();

      await apiAccess.checkApiKey(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });
  });
});
