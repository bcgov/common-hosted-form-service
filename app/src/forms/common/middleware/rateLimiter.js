const config = require('config');
const rateLimit = require('express-rate-limit');

/**
 * Returns true if the caller is using an API Key (Basic auth). Note that the
 * web application will have no auth for unauthenticated (public) users, or
 * Bearer auth for authenticated users.
 *
 * @param {string} authorizationHeader the HTTP request's authorization header.
 * @returns a boolean that is true if the caller is using Basic auth.
 */
const _isApiKeyUser = (authorizationHeader) => {
  return authorizationHeader && authorizationHeader.startsWith('Basic ');
};

/**
 * Gets the rate limit to use depending on whether or not the call is using an
 * API Key (Basic auth).
 *
 * @param {string} authorizationHeader the HTTP request's authorization header.
 */
const _getRateLimit = (authorizationHeader) => {
  let rateLimit;

  if (_isApiKeyUser(authorizationHeader)) {
    rateLimit = config.get('server.rateLimit.public.limitApiKey');
  } else {
    rateLimit = config.get('server.rateLimit.public.limitFrontend');
  }

  return rateLimit;
};

const apiKeyRateLimiter = rateLimit({
  // Instead of legacy headers use the standardHeaders version defined below.
  legacyHeaders: false,

  limit: (req) => _getRateLimit(req.headers?.authorization),

  // Use the latest draft of the IETF standard for rate limiting headers.
  standardHeaders: 'draft-7',

  windowMs: parseInt(config.get('server.rateLimit.public.windowMs')),
});

module.exports.apiKeyRateLimiter = apiKeyRateLimiter;
