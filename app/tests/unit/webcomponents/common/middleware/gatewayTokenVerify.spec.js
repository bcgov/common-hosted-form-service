const gatewayTokenVerify = require('../../../../../src/webcomponents/common/middleware/gatewayTokenVerify');
const { verifyTokenAndGetPayload } = require('../../../../../src/gateway/v1/auth/service');

// Mock only the verifyTokenAndGetPayload function
jest.mock('../../../../../src/gateway/v1/auth/service', () => ({
  verifyTokenAndGetPayload: jest.fn(),
}));

describe('gatewayTokenVerify middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {}, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
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
    // Mock auth service to return invalid result
    verifyTokenAndGetPayload.mockResolvedValue({
      valid: false,
      error: 'Invalid token signature',
    });

    req.headers['authorization'] = 'Bearer invalidtoken';
    await gatewayTokenVerify(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      detail: 'Invalid or expired token',
      error: 'Invalid token signature',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if token missing formId claim', async () => {
    // Mock auth service to return valid token but without formId
    verifyTokenAndGetPayload.mockResolvedValue({
      valid: true,
      payload: { foo: 'bar', userId: 'user123' }, // Missing formId
    });

    req.headers['authorization'] = 'Bearer validtoken';
    await gatewayTokenVerify(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: 'Token missing formId claim' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if route param formId does not match token formId', async () => {
    // Mock auth service to return valid token with formId 'abc'
    verifyTokenAndGetPayload.mockResolvedValue({
      valid: true,
      payload: { formId: 'abc', userId: 'user123' },
    });

    req.headers['authorization'] = 'Bearer validtoken';
    req.params.formId = 'xyz'; // Different from token's formId
    await gatewayTokenVerify(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ detail: 'Token formId does not match requested formId' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should set req.params.formId and call next for valid token', async () => {
    // Mock auth service to return valid token with formId
    verifyTokenAndGetPayload.mockResolvedValue({
      valid: true,
      payload: { formId: 'abc', userId: 'user123' },
    });

    req.headers['authorization'] = 'Bearer validtoken';
    await gatewayTokenVerify(req, res, next);
    expect(req.params.formId).toBe('abc');
    expect(req.gatewayTokenPayload.formId).toBe('abc');
    expect(req.gatewayTokenPayload.userId).toBe('user123');
    expect(req.apiUser).toBe(true); // Should be set to true after successful verification
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 if auth service throws an error', async () => {
    // Mock auth service to throw an error
    verifyTokenAndGetPayload.mockRejectedValue(new Error('Service unavailable'));

    req.headers['authorization'] = 'Bearer validtoken';
    await gatewayTokenVerify(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      detail: 'Token verification failed',
      error: 'Service unavailable',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
