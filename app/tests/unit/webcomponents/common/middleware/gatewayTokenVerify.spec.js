const gatewayTokenVerify = require('../../../../../src/webcomponents/common/middleware/gatewayTokenVerify');
const config = require('config');

describe('gatewayTokenVerify middleware', () => {
  let req, res, next;
  const JWT_SECRET = config.get('gateway.jwtSecret');

  beforeEach(() => {
    req = { headers: {}, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('should call next if req.apiUser is present', async () => {
    req.apiUser = { id: 'user' };
    await gatewayTokenVerify(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 if no Authorization header', async () => {
    await gatewayTokenVerify(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ detail: 'Missing or invalid Authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if Authorization header is not Bearer', async () => {
    req.headers['authorization'] = 'Basic abc';
    await gatewayTokenVerify(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ detail: 'Missing or invalid Authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    req.headers['authorization'] = 'Bearer invalidtoken';
    await gatewayTokenVerify(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].detail).toBe('Invalid or expired token');
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if token missing formId claim', async () => {
    // Create a valid JWT without formId
    const jose = require('jose');
    const token = await new jose.SignJWT({ foo: 'bar' }).setProtectedHeader({ alg: 'HS256' }).sign(Buffer.from(JWT_SECRET, 'utf-8'));
    req.headers['authorization'] = 'Bearer ' + token;
    await gatewayTokenVerify(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: 'Token missing formId claim' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if route param formId does not match token formId', async () => {
    // Create a valid JWT with formId
    const jose = require('jose');
    const token = await new jose.SignJWT({ formId: 'abc' }).setProtectedHeader({ alg: 'HS256' }).sign(Buffer.from(JWT_SECRET, 'utf-8'));
    req.headers['authorization'] = 'Bearer ' + token;
    req.params.formId = 'xyz';
    await gatewayTokenVerify(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ detail: 'Token formId does not match requested formId' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should set req.params.formId and call next for valid token', async () => {
    // Create a valid JWT with formId
    const jose = require('jose');
    const token = await new jose.SignJWT({ formId: 'abc' }).setProtectedHeader({ alg: 'HS256' }).sign(Buffer.from(JWT_SECRET, 'utf-8'));
    req.headers['authorization'] = 'Bearer ' + token;
    await gatewayTokenVerify(req, res, next);
    expect(req.params.formId).toBe('abc');
    expect(req.gatewayTokenPayload.formId).toBe('abc');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
