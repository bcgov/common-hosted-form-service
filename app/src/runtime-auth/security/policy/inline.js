/**
 * Inline Policy Matcher
 * Generates policies dynamically from route context and inference
 */

const securityLog = require('../logger');

// ---------- Inference helpers ----------
function pathFromUrlLike(u) {
  if (!u) return '/';
  if (/^https?:\/\//i.test(u)) {
    try {
      return new URL(u).pathname || '/';
    } catch {
      return '/';
    }
  }
  return String(u).split('?')[0] || '/';
}

function basePathFromUrlLike(u) {
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) {
    try {
      return new URL(u).pathname || '';
    } catch {
      return '';
    }
  }
  return String(u);
}

function stripLeadingSlash(s) {
  return s && s.startsWith('/') ? s.slice(1) : s;
}

function inferClassification(req, deps) {
  const urlPath = pathFromUrlLike(req.originalUrl || req.url || '/');
  const basePath = basePathFromUrlLike(deps.baseUrl || deps.urlBasePath || '');
  let rest = urlPath;
  if (basePath) {
    const bp = basePath.endsWith('/') && basePath !== '/' ? basePath.slice(0, -1) : basePath;
    if (bp && rest.startsWith(bp)) rest = rest.slice(bp.length) || '/';
  }
  const first = stripLeadingSlash(rest).split('/').find(Boolean);
  return first || 'root';
}

function inferResourceSpec(req) {
  const p = req.params || {};
  const q = req.query || {};
  const formId = p.formId ?? q.formId;
  const submissionId = p.submissionId ?? q.submissionId;
  const fileId = p.fileId ?? q.fileId;

  if (fileId) return { kind: 'file', params: { fileId } };
  if (submissionId) return { kind: 'submissionFromForm', params: { formId, submissionId } };
  if (formId) return { kind: 'formOnly', params: { formId } };
  return { kind: 'none' };
}

function normalizePolicy(spec, req, deps) {
  const s = typeof spec === 'function' ? spec(req) : spec || {};

  // Default allow = non-public cascade; can be customized with deps.authOrderDefault
  const defaultAllow = Array.isArray(deps?.authOrderDefault) && deps.authOrderDefault.length ? deps.authOrderDefault : ['userOidc', 'apiKeyBasic', 'gatewayBearer'];

  const allowedAuth = s.allowedAuth || s.allow || defaultAllow;

  // Auto classification unless explicitly set
  const classification = s.classification ?? inferClassification(req, deps);

  // Pattern for logs (prefer express' route path)
  const pattern = s.pattern || (req.route && req.route.path) || req.path;

  // Resource inference unless explicitly provided
  let resourceSpec = s.resourceSpec || (typeof s.resource === 'function' ? s.resource({ req, params: req.params, query: req.query }) : inferResourceSpec(req));

  // If resourceSpec is provided but params is missing, infer params
  if (resourceSpec && !resourceSpec.params) {
    const inferredSpec = inferResourceSpec(req);
    if (inferredSpec.params) {
      resourceSpec = { ...resourceSpec, params: inferredSpec.params };
    }
  }

  const requiredPermissions = s.requiredPermissions || s.require || [];

  return { allowedAuth, classification, resourceSpec, requiredPermissions, pattern };
}

/**
 * Creates an inline policy matcher that generates policies on-the-fly
 * @param {Function|Object} specOrFn - Policy specification or function
 * @param {Object} deps - Dependencies
 * @returns {Object} Policy matcher with match() method
 */
function createInlineMatcher(specOrFn, deps) {
  const policyLogger = securityLog.policyStore;

  function match(req) {
    policyLogger.debug({
      event: 'policy_match_start',
      method: req.method,
      path: req.path,
      hasRoute: !!req.route,
      routePath: req.route?.path,
    });

    const policy = normalizePolicy(specOrFn, req, deps);

    policyLogger.info({
      event: 'policy_match_complete',
      method: req.method,
      path: req.path,
      pattern: policy.pattern,
      classification: policy.classification,
      resourceKind: policy.resourceSpec?.kind || 'none',
      allowedAuth: policy.allowedAuth,
      requiredPermissions: policy.requiredPermissions?.length || 0,
    });

    return policy;
  }

  return { match };
}

module.exports = {
  createInlineMatcher,
  normalizePolicy,
  inferClassification,
  inferResourceSpec,
};
