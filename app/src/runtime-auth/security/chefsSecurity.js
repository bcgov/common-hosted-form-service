/**
 * CHEFS-configured security middleware
 * Pre-wired with all CHEFS dependencies for easy use
 */
const makeOrchestrator = require('./orchestrator');
const makeAuthRegistry = require('./auth/registry');
const makeAuthStrategies = require('./auth/strategies');
const { createCentralizedMatcher } = require('./policy/centralized');
const makeResourceResolver = require('./resource/resolve');
const makeEnrichRBAC = require('./rbac/enrich');
const secure = require('./inline');

// Direct implementation to avoid circular dependency
function buildSecurity(deps, customPolicies = []) {
  const strategies = makeAuthStrategies(deps);
  const authRegistry = makeAuthRegistry({ strategies, deps });
  const resolver = makeResourceResolver({ deps });
  const enrichRBAC = makeEnrichRBAC({ deps });
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

/**
 * Creates a pre-configured security middleware with all CHEFS dependencies
 * @param {Object} config - Configuration including services
 * @returns {Object} Configured security helpers
 */
function makeCHEFSSecurity(config = {}) {
  const { constants, baseUrl } = config;

  // Import all CHEFS services
  const authService = require('../../forms/auth/service');
  const formService = require('../../forms/form/service');
  const submissionService = require('../../forms/submission/service');
  const fileService = require('../../forms/file/service');
  const rbacService = require('../../forms/rbac/service');
  const jwtService = require('../../components/jwtService');
  const gatewayService = require('../../gateway/v1/auth/service');

  const constantsModule = constants || require('../../forms/common/constants');

  // Build dependencies object
  const deps = {
    baseUrl, // Server base path for route classification
    services: {
      authService,
      formService,
      submissionService,
      fileService,
      rbacService,
      jwtService,
      gatewayService,
    },
    constants: constantsModule,
    ...config.deps, // Allow overriding
  };

  /**
   * Pre-configured buildSecurity with CHEFS dependencies
   * @param {Array} customPolicies - Optional custom policies
   * @returns {Function} Express middleware
   */
  const secureRoute = (customPolicies = []) => {
    return buildSecurity(deps, customPolicies);
  };

  /**
   * Pre-configured secure() with CHEFS dependencies
   * @param {Object|Function} specOrFn - Policy spec or function
   * @returns {Function} Express middleware
   */
  const secureInline = (specOrFn) => {
    return secure(specOrFn, deps);
  };

  return {
    /**
     * Centralized policy approach
     * @example
     * chefSecurity.withPolicies([{
     *   method: 'GET',
     *   pattern: '/forms/:formId',
     *   allowedAuth: [],
     *   requiredPermissions: [Permissions.FORM_READ]
     * }])
     */
    withPolicies: secureRoute,

    /**
     * Inline policy approach
     * @example
     * chefSecurity.inline({
     *   allowedAuth: ['public', 'userOidc'],
     *   requiredPermissions: []
     * })
     */
    inline: secureInline,

    /**
     * Get dependencies (useful for passing to other helpers)
     */
    getDeps: () => deps,

    /**
     * Build security with custom dependencies override
     */
    custom: (depsOverride, customPolicies = []) => {
      return buildSecurity({ ...deps, ...depsOverride }, customPolicies);
    },
  };
}

let singletonInstance = null;

/**
 * Create a singleton CHEFS security instance
 * This assumes a global logger and configuration
 * Instance is created once at startup and reused
 * @param {Object} config - Configuration including logger, baseUrl, etc.
 */
function createCHEFSSecurity(config = {}) {
  // Check if config has changed significantly (baseUrl changed)
  // For now, always create if not exists
  if (!singletonInstance) {
    singletonInstance = makeCHEFSSecurity(config);
  }
  return singletonInstance;
}

module.exports = { makeCHEFSSecurity, createCHEFSSecurity };
