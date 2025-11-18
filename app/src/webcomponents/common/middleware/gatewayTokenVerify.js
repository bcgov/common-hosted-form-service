// Middleware to verify gateway token and extract formId
const { verifyTokenAndGetPayload } = require('../../../gateway/v1/auth/service');

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

    // Use centralized auth service for verification
    const verificationResult = await verifyTokenAndGetPayload(token);

    if (!verificationResult.valid) {
      res.status(401).json({
        detail: 'Invalid or expired token',
        error: verificationResult.error,
      });
      return;
    }

    const { payload } = verificationResult;

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
    // to get a valid token, we used the api, so set the apiUser to true
    req.apiUser = true;
    next();
  } catch (err) {
    res.status(401).json({ detail: 'Token verification failed', error: err.message });
  }
};
