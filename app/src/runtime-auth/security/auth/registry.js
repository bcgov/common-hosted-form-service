/**
 * Auth registry with cascading default behavior.
 * Each strategy: { name, canHandle(req), authenticate(req, deps, policy) }
 *
 * Behavior:
 *  - If 'allowedAuth' is omitted/empty, we cascade across NON-PUBLIC strategies in declared order.
 *  - We try each strategy whose canHandle(req) is true. If it throws 401, we continue.
 *    Any other error short-circuits.
 *  - If none succeed, we throw 401.
 *  - Public is ALWAYS explicit (never part of default cascade).
 */

const ERRORS = require('../errorMessages');
const securityLog = require('../logger');

module.exports = function makeAuthRegistry({ strategies }) {
  const nameMap = new Map(strategies.map((s) => [s.name, s]));
  const nonPublicDefault = strategies.filter((s) => !s.isPublic).map((s) => s.name);
  const authLogger = securityLog.authRegistry;

  function resolveAllowed(allowedAuth) {
    if (!allowedAuth || allowedAuth.length === 0) return nonPublicDefault;
    return allowedAuth;
  }

  async function authenticate(allowedAuth, req, deps, policy) {
    const allowed = resolveAllowed(allowedAuth);

    let lastErr;
    for (const name of allowed) {
      const strat = nameMap.get(name);
      if (!strat) continue;
      if (!strat.canHandle(req)) continue;

      try {
        const result = await strat.authenticate(req, deps, policy);
        // Log successful authentication
        securityLog.logAuthAttempt(authLogger, result?.actor, name, true, {
          policyPattern: policy?.pattern,
          method: req.method,
          path: req.path,
        });
        return result;
      } catch (err) {
        // Log failed authentication attempt
        securityLog.logAuthAttempt(authLogger, null, name, false, {
          policyPattern: policy?.pattern,
          method: req.method,
          path: req.path,
          error: err.message,
        });

        if (err && (err.status === 401 || err.code === 401)) {
          lastErr = err;
          continue;
        }
        throw err; // any non-401 error is a hard failure
      }
    }

    const e = new Error(ERRORS.AUTHENTICATION_FAILED);
    e.status = 401;
    if (lastErr && lastErr.message) e.message = lastErr.message;
    throw e;
  }

  return { authenticate, resolveAllowed };
};
