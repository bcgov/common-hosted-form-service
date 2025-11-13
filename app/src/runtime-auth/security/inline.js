// Route-local policy helper with automatic classification + resource inference,
// and default cascade of non-public auth strategies when allow is omitted.

const makeOrchestrator = require('./orchestrator');
const makeAuthRegistry = require('./auth/registry');
const makeAuthStrategies = require('./auth/strategies');
const makeResourceResolver = require('./resource/resolve');
const makeEnrichRBAC = require('./rbac/enrich');
const { createInlineMatcher } = require('./policy/inline');

/**
 * secure(specOrFn, deps)
 *  - Omit classification/resource to auto-infer from request.
 *  - Omit allow to cascade through non-public strategies by default.
 *  - Set deps.baseUrl to influence classification inference (full URL or path).
 */
function secure(specOrFn, deps) {
  const strategies = makeAuthStrategies(deps);
  const authRegistry = makeAuthRegistry({ strategies, deps });
  const resolver = makeResourceResolver({ deps });
  const enrichRBAC = makeEnrichRBAC({ deps }); // Create the actual function
  const policyStore = createInlineMatcher(specOrFn, deps);

  const orchestrator = makeOrchestrator({
    deps,
    policyStore,
    authRegistry,
    resolver,
    enrichRBAC,
  });

  return orchestrator.middleware;
}

module.exports = secure;
