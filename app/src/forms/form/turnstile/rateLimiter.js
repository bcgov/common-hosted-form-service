const Problem = require('api-problem');
const rateLimit = require('express-rate-limit');

const options = {
  windowMs: 60_000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new Problem(429, { detail: 'Too many verification requests. Please try again later.' }));
  },
};

// Share each IP budget across form and saved-submission endpoints.
const turnstileStatusLimiter = rateLimit({ ...options, limit: 60 });
const turnstileVerificationLimiter = rateLimit({ ...options, limit: 15 });

module.exports = { turnstileStatusLimiter, turnstileVerificationLimiter };
