const controller = require('../../../../src/gateway/v1/auth/controller');
const tokenService = require('../../../../src/gateway/v1/auth/service');

const { getMockReq, getMockRes } = require('@jest-mock/express');
// Minimal mock for tokenService
jest.mock('../../../../src/gateway/v1/auth/service', () => ({
  // eslint-disable-next-line no-unused-vars
  createToken: jest.fn(async (_payload) => 'mocked-token'),
  // eslint-disable-next-line no-unused-vars
  refreshToken: jest.fn(async (_refreshToken) => 'refreshed-token'),
  validateToken: jest.fn(async (token) => token === 'valid-token'),
}));

describe('gateway/v1/auth/controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = getMockReq();
    // getMockRes returns { res, next, ... } but res.status etc are not direct mock functions
    // Instead, getMockRes().res.status is a mock function
    const mockRes = getMockRes();
    res = mockRes.res;
    next = jest.fn();
  });

  test('issueFormToken returns 201 and token', async () => {
    req.body = { userId: 'u1' };
    req.params.formId = 'abc';
    await controller.issueFormToken(req, res, next);
    expect(tokenService.createToken).toHaveBeenCalledWith({ userId: 'u1', formId: 'abc' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ token: 'mocked-token' });
  });

  test('issueFormToken calls next on error', async () => {
    tokenService.createToken.mockImplementationOnce(() => {
      throw new Error('fail');
    });
    await controller.issueFormToken(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('refreshToken returns 200 and refreshed token', async () => {
    req.body = { refreshToken: 'rtok' };
    await controller.refreshToken(req, res, next);
    expect(tokenService.refreshToken).toHaveBeenCalledWith('rtok');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: 'refreshed-token' });
  });

  test('refreshToken returns 400 if missing refreshToken', async () => {
    req.body = {};
    await controller.refreshToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: 'Missing refreshToken' });
  });

  test('refreshToken calls next on error', async () => {
    tokenService.refreshToken.mockImplementationOnce(() => {
      throw new Error('fail');
    });
    req.body = { refreshToken: 'rtok' };
    await controller.refreshToken(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('validateToken returns 204 for valid token', async () => {
    req.body = { token: 'valid-token' };
    await controller.validateToken(req, res, next);
    expect(tokenService.validateToken).toHaveBeenCalledWith('valid-token');
    expect(res.sendStatus).toHaveBeenCalledWith(204);
  });

  test('validateToken returns 401 for invalid token', async () => {
    req.body = { token: 'invalid-token' };
    await controller.validateToken(req, res, next);
    expect(tokenService.validateToken).toHaveBeenCalledWith('invalid-token');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ detail: 'Invalid token' });
  });

  test('validateToken returns 400 if missing token', async () => {
    req.body = {};
    await controller.validateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: 'Missing token' });
  });

  test('validateToken calls next on error', async () => {
    tokenService.validateToken.mockImplementationOnce(() => {
      throw new Error('fail');
    });
    req.body = { token: 'valid-token' };
    await controller.validateToken(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
