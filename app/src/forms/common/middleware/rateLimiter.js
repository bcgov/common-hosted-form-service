const config = require('config');
const rateLimit = require('express-rate-limit');

const apiKeyRateLimiter = rateLimit({
  // Instead of legacy headers use the standardHeaders version defined below.
  legacyHeaders: false,

  limit: config.get('server.rateLimit.public.max'),

  // Skip Bearer token auth so that CHEFS app users are not limited.
  skip: (req) => req.headers && req.headers.authorization && !req.headers.authorization.startsWith('Basic '),

  // Use the latest draft of the IETF standard for rate limiting headers.
  standardHeaders: 'draft-7',

  windowMs: parseInt(config.get('server.rateLimit.public.windowMs')),
});

module.exports.apiKeyRateLimiter = apiKeyRateLimiter;
