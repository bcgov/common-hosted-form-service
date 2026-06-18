const crypto = require('node:crypto');
const Problem = require('api-problem');

/**
 * Constant-time comparison of two strings. Returns false on any length
 * mismatch (and never throws) so it is safe to feed user-supplied input.
 *
 * @param {string} a the first value to compare.
 * @param {string} b the second value to compare.
 * @returns {boolean} true only if both values are identical.
 */
const _safeCompare = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Checks that the API Key in the request headers matches the API Key in the
 * process environment variables. This guards system-only endpoints (the
 * reminder and records-management deletion cron routes), so it deliberately
 * only honours the `apikey` header - an `Authorization` header (Bearer/Basic)
 * must NOT be treated as a way past this check.
 *
 * @param {*} req the Express object representing the HTTP request.
 * @param {*} _res the Express object representing the HTTP response - unused.
 * @param {*} next the Express chaining function.
 */
const checkApiKey = async (req, _res, next) => {
  try {
    const requestApikey = req.headers.apikey;
    if (requestApikey === undefined || requestApikey === '') {
      throw new Problem(401, {
        detail: 'No API key provided',
      });
    }

    // Fail closed: if the server has no API key configured then nothing can
    // satisfy this check, so never fall through to next().
    const systemApikey = process.env.APITOKEN;
    if (!systemApikey) {
      throw new Problem(401, {
        detail: 'Invalid API key',
      });
    }

    if (!_safeCompare(requestApikey, systemApikey)) {
      throw new Problem(401, {
        detail: 'Invalid API key',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkApiKey,
};
