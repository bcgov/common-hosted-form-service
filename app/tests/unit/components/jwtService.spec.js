const { getMockReq, getMockRes } = require('@jest-mock/express');
const jose = require('jose');
const Problem = require('api-problem');

const config = require('config');
const jwtService = require('../../../src/components/jwtService');

describe('jwtService', () => {
  const assertService = (srv) => {
    expect(srv).toBeTruthy();
    expect(srv.audience).toBe(config.get('server.oidc.audience'));
    expect(srv.issuer).toBe(config.get('server.oidc.issuer'));
    expect(srv.maxTokenAge).toBe(config.get('server.oidc.maxTokenAge'));
  };

  it('should return a service', () => {
    assertService(jwtService);
  });

  it('should get token if bearer', () => {
    const req = getMockReq({ headers: { authorization: 'Bearer JWT' } });
    const bearerToken = jwtService.getBearerToken(req);
    expect(bearerToken).toBe('JWT');
  });

  it('should not get token if basic', () => {
    const req = getMockReq({ headers: { authorization: 'Basic username/password' } });
    const bearerToken = jwtService.getBearerToken(req);
    expect(bearerToken).toBe(null);
  });

  it('should get payload if token valid', async () => {
    const jwt = {};
    const payload = {};
    jwtService.getBearerToken = jest.fn().mockReturnValue(jwt);
    // need to mock out this whole function, very difficult to mock jose...
    jwtService._verify = jest.fn().mockReturnValue(payload);

    const req = getMockReq({ headers: { authorization: 'Bearer JWT' } });
    const r = await jwtService.getTokenPayload(req);
    expect(r).toBe(payload);
    expect(jwtService.getBearerToken).toBeCalledTimes(1);
    expect(jwtService._verify).toBeCalledTimes(1);
  });

  it('should error if token not valid', async () => {
    const jwt = {};
    jwtService.getBearerToken = jest.fn().mockReturnValue(jwt);
    // need to mock out this whole function, very difficult to mock jose...
    jwtService._verify = jest.fn().mockImplementation(() => {
      throw new jose.errors.JWTClaimValidationFailed('bad');
    });

    const req = getMockReq({ headers: { authorization: 'Bearer JWT' } });
    let payload = undefined;
    try {
      payload = await jwtService.getTokenPayload(req);
    } catch (e) {
      expect(e).toBeInstanceOf(jose.errors.JWTClaimValidationFailed);
      expect(payload).toBe(undefined);
    }
    expect(jwtService.getBearerToken).toBeCalledTimes(1);
    expect(jwtService._verify).toBeCalledTimes(1);
  });

  it('should validate access token on good jwt', async () => {
    const payload = {};
    // need to mock out this whole function, very difficult to mock jose...
    jwtService._verify = jest.fn().mockReturnValue(payload);

    const req = getMockReq({ headers: { authorization: 'Bearer JWT' } });
    const r = await jwtService.validateAccessToken(req);
    expect(r).toBeTruthy();
    expect(jwtService._verify).toBeCalledTimes(1);
  });

  it('should not validate access token on jwt error', async () => {
    // need to mock out this whole function, very difficult to mock jose...
    jwtService._verify = jest.fn().mockImplementation(() => {
      throw new jose.errors.JWTClaimValidationFailed('bad');
    });

    const req = getMockReq({ headers: { authorization: 'Bearer JWT' } });
    const r = await jwtService.validateAccessToken(req);
    expect(r).toBeFalsy();

    expect(jwtService._verify).toBeCalledTimes(1);
  });

  it('should throw problem when validate access token catches (non-jwt) error)', async () => {
    // need to mock out this whole function, very difficult to mock jose...
    jwtService._verify = jest.fn().mockImplementation(() => {
      throw new Error('bad');
    });

    const req = getMockReq({ headers: { authorization: 'Bearer JWT' } });
    let r = undefined;
    let e = undefined;
    try {
      r = await jwtService.validateAccessToken(req);
    } catch (error) {
      e = error;
    }

    expect(e).toBeInstanceOf(Problem);
    expect(r).toBe(undefined);
    expect(jwtService._verify).toBeCalledTimes(1);
  });

  it('should pass middleware protect with valid jwt)', async () => {
    const jwt = {};
    const payload = { client_roles: ['admin'] };
    jwtService.getBearerToken = jest.fn().mockReturnValue(jwt);
    // need to mock out this whole function, very difficult to mock jose...
    jwtService._verify = jest.fn().mockReturnValue(payload);

    const req = getMockReq({
      headers: { authorization: 'Bearer JWT' },
    });
    const { res, next } = getMockRes();

    const middleware = jwtService.protect();

    await middleware(req, res, next);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith();
  });

  it('should fail middleware protect with invalid jwt', async () => {
    const jwt = {};
    jwtService.getBearerToken = jest.fn().mockReturnValue(jwt);
    // need to mock out this whole function, very difficult to mock jose...
    jwtService._verify = jest.fn().mockImplementation(() => {
      throw new jose.errors.JWTClaimValidationFailed('bad');
    });

    const req = getMockReq({
      headers: { authorization: 'Bearer JWT' },
    });
    const { res, next } = getMockRes();

    const middleware = jwtService.protect();

    await middleware(req, res, next);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('should pass middleware protect with valid jwt and role', async () => {
    const jwt = {};
    const payload = { client_roles: ['admin'] };
    jwtService.getBearerToken = jest.fn().mockReturnValue(jwt);
    // need to mock out this whole function, very difficult to mock jose...
    jwtService._verify = jest.fn().mockReturnValue(payload);

    const req = getMockReq({
      headers: { authorization: 'Bearer JWT' },
    });
    const { res, next } = getMockRes();

    const middleware = jwtService.protect('admin');

    await middleware(req, res, next);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith();
  });

  it('should fail middleware protect with valid jwt and but no role', async () => {
    const jwt = {};
    const payload = { client_roles: [] };
    jwtService.getBearerToken = jest.fn().mockReturnValue(jwt);
    // need to mock out this whole function, very difficult to mock jose...
    jwtService._verify = jest.fn().mockReturnValue(payload);

    const req = getMockReq({
      headers: { authorization: 'Bearer JWT' },
    });
    const { res, next } = getMockRes();

    const middleware = jwtService.protect('admin');

    await middleware(req, res, next);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(expect.objectContaining({ status: 401 }));
  });
});
