const Problem = require('api-problem');
const config = require('config');
const rateLimit = require('express-rate-limit');

const log = require('../../../components/log')(module.filename);

function readLimit(key, fallback, max = Number.MAX_SAFE_INTEGER) {
  const path = `server.rateLimit.turnstile.${key}`;
  if (!config.has(path)) return fallback;

  const raw = String(config.get(path)).trim();
  const value = /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
  if (Number.isSafeInteger(value) && value > 0 && value <= max) return value;

  log.warn('Invalid Turnstile rate limit setting, using the default', { setting: path, default: fallback });
  return fallback;
}

const options = {
  windowMs: readLimit('windowMs', 60_000, 2_147_483_647),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new Problem(429, { detail: 'Too many verification requests. Please try again later.' }));
  },
};

// Share each IP budget across form and saved-submission endpoints.
const turnstileStatusLimiter = rateLimit({ ...options, limit: readLimit('limitStatus', 60) });
const turnstileVerificationLimiter = rateLimit({ ...options, limit: readLimit('limitVerification', 15) });

module.exports = { turnstileStatusLimiter, turnstileVerificationLimiter };
