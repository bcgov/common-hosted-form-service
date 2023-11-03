const config = require('config');
const rateLimit = require('express-rate-limit');

const apiKeyRateLimiter = rateLimit({
  limit: config.get('server.rateLimit.public.max'),

  // Skip Bearer token auth so that CHEFS app users are not limited.
  skip: (req) => req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer '),

  windowMs: config.get('server.rateLimit.public.windowMs'),
});

module.exports.apiKeyRateLimiter = apiKeyRateLimiter;
