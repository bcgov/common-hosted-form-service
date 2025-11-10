/**
 * Centralized Policy Matcher
 * Matches routes from a pre-configured list of patterns
 *
 * customPolicies format (array of policy objects):
 * [
 *   {
 *     method: 'GET',
 *     pattern: '/forms/:formId/submissions/:submissionId/files/:fileId',
 *     allowedAuth: [], // empty -> cascade non-public by default
 *     classification: 'restricted',
 *     resource: (_req, params) => ({ kind: 'fileFromSubmission', params }),
 *     requiredPermissions: ['submission_read'], // Files inherit submission permissions
 *   },
 *   {
 *     method: 'DELETE',
 *     pattern: '/forms/:formId/submissions/:submissionId/files/:fileId',
 *     allowedAuth: [],
 *     classification: 'restricted',
 *     resource: (_req, params) => ({ kind: 'fileFromSubmission', params }),
 *     requiredPermissions: ['submission_update'], // Files inherit submission permissions
 *   },
 *   {
 *     method: 'GET',
 *     pattern: '/health/public',
 *     allowedAuth: ['public'], // explicit public access
 *     classification: 'public',
 *     resource: () => ({ kind: 'none' }),
 *     requiredPermissions: [],
 *   },
 * ]
 */

function extractParams(pattern, path) {
  const pSegs = pattern.split('/').filter(Boolean);
  const aSegs = path.split('/').filter(Boolean);
  if (pSegs.length !== aSegs.length) return null;
  const out = {};
  for (let i = 0; i < pSegs.length; i++) {
    const p = pSegs[i];
    const a = aSegs[i];
    if (p.startsWith(':')) out[p.slice(1)] = decodeURIComponent(a);
    else if (p !== a) return null;
  }
  return out;
}

/**
 * Creates a centralized policy matcher using pre-defined patterns
 * @param {Array} policies - Custom policy list (empty array = no predefined policies)
 * @returns {Object} Policy matcher with match() method
 */
function createCentralizedMatcher(customPolicies = []) {
  const policies = customPolicies;

  function match(req) {
    const { method, path = req.path || req.url } = req;
    for (const p of policies) {
      if (p.method !== method) continue;
      const params = extractParams(p.pattern, path);
      if (!params) continue;
      return {
        allowedAuth: p.allowedAuth?.slice() || [],
        classification: p.classification,
        resourceSpec: p.resource?.(req, params) || p.resourceSpec || { kind: 'none' },
        requiredPermissions: p.requiredPermissions?.slice() || [],
        pattern: p.pattern,
      };
    }
    return null;
  }

  return { match, policies };
}

module.exports = { createCentralizedMatcher, extractParams };
