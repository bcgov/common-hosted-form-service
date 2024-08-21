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
  });
});
