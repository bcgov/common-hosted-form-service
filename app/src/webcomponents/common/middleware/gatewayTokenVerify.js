// Middleware to verify gateway token and extract formId
const { jwtVerify } = require('jose');
const config = require('config');

const JWT_SECRET = config.get('gateway.jwtSecret');

module.exports = async function gatewayTokenVerify(req, res, next) {
  try {
    // Skip permission checks if req is already validated using an API key.
    // this middleware should be called AFTER apiAccess middleware...
    if (req.apiUser) {
      next();
      return;
    }

    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ detail: 'Missing or invalid Authorization header' });
      return;
    }
    const token = authHeader.slice(7);
    const { payload } = await jwtVerify(token, Buffer.from(JWT_SECRET, 'utf-8'));
    if (!payload.formId) {
      res.status(400).json({ detail: 'Token missing formId claim' });
      return;
    }
    req.params = req.params || {};
    // If route param formId exists, check it matches token's formId
    if (req.params.formId && req.params.formId !== payload.formId) {
      res.status(403).json({ detail: 'Token formId does not match requested formId' });
      return;
    }
    // Always set req.params.formId to token's formId for downstream use
    req.params.formId = payload.formId;
    req.gatewayTokenPayload = payload;
    next();
  } catch (err) {
    res.status(401).json({ detail: 'Invalid or expired token', error: err.message });
  }
};
