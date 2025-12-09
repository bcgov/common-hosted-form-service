const makeOrchestrator = require('./orchestrator');
const makeAuthRegistry = require('./auth/registry');
const makeAuthStrategies = require('./auth/strategies');

const { createCentralizedMatcher } = require('./policy/centralized');
const makeResourceResolver = require('./resource/resolve');
const makeEnrichRBAC = require('./rbac/enrich');
const secure = require('./inline');

// Export middleware helpers
const requirePermissions = require('./middleware/requirePermissions');
const { hasFileCreate, hasFilePermissions } = require('./middleware/filePermissions');

/**
 * buildSecurity(deps, customPolicies) -> Express middleware
 *
 * @param {Object} deps - Dependencies including logger, services, etc.
 * @param {Array} customPolicies - Optional array of policy definitions (see policy/centralized.js for examples)
 *
 * deps:
 *   logger, clock, jose, jwksFetcher, timingSafeEqual,
 *   services: { jwtService, authService, formService, submissionService, fileService, gatewayService },
 *   oidc: { issuer, audience, maxTokenAge, clockTolerance },
 *   baseUrl (optional), authOrderDefault (optional)
 */
function buildSecurity(deps, customPolicies = []) {
  const strategies = makeAuthStrategies(deps);
  const authRegistry = makeAuthRegistry({ strategies, deps });
  const resolver = makeResourceResolver({ deps });
  const enrichRBAC = makeEnrichRBAC({ deps });

  // Create centralized policy matcher (pass empty array for no predefined policies)
  const policyStore = createCentralizedMatcher(customPolicies);

  const orchestrator = makeOrchestrator({
    deps,
    policyStore,
    authRegistry,
    resolver,
    enrichRBAC,
  });

  return orchestrator.middleware;
}

// CHEFS-specific factory
const { makeCHEFSSecurity, createCHEFSSecurity } = require('./chefsSecurity');
const { AuthTypes, AuthCombinations } = require('./auth/types');

module.exports = {
  buildSecurity,
  secure,
  requirePermissions, // Unified permission middleware (replaces validatePermissions & checkPermission)
  hasFileCreate, // File upload middleware
  hasFilePermissions, // File access middleware
  makeCHEFSSecurity, // Factory for creating pre-configured security
  createCHEFSSecurity, // Convenience for default config
  AuthTypes, // Authentication type constants
  AuthCombinations, // Common auth combinations
};
