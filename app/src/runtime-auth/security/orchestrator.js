/**
 * Thin coordinator: policy → auth → resource → rbac
 * Emits a single structured summary log. Attaches req.securityContext.
 */

const Problem = require('api-problem');
const clsRtracer = require('cls-rtracer');
const { HTTP_STATUS } = require('./httpStatus');
const ERRORS = require('./errorMessages');
const { generateCurrentUserFromActor, isApiUser, isPublicUser } = require('./auth/utils/currentUser');
const { validatePermissionsLogic } = require('./auth/utils/validatePermissions');
const securityLog = require('./logger');

function isOutsideCredentialForm(actor, resource) {
  if (!actor || !isApiUser(actor)) return false;
  // A draft file with no recorded form cannot be tied to the credential's form
  if (!resource?.form) return !!resource?.file;
  return String(resource.form.id).toLowerCase() !== String(actor.formId).toLowerCase();
}

function isAnonymousOnNonPublicForm(actor, resource) {
  return !!actor && isPublicUser(actor) && !!resource?.form && !resource.publicForm;
}

// A route with :formId in its path acts on that form, so the checked resource must be that form
function isOutsidePathForm(req, resource) {
  const formId = req.params?.formId;
  if (!formId) return false;
  return !resource?.form || String(resource.form.id).toLowerCase() !== String(formId).toLowerCase();
}

module.exports = function makeOrchestrator({ deps, policyStore, authRegistry, resolver, enrichRBAC }) {
  const { clock = { now: () => Date.now() } } = deps;
  const orchestratorLogger = securityLog.orchestrator;

  async function run(req, res, next) {
    const startedAtMs = clock.now();
    const startedAt = new Date(startedAtMs).toISOString();
    const cid = clsRtracer.id(req);

    let tAuth = 0,
      tRes = 0,
      tRbac = 0;

    try {
      // 1) Policy
      const policy = policyStore.match(req);
      if (!policy) throw new Problem(HTTP_STATUS.NOT_FOUND, { detail: ERRORS.POLICY_NOT_FOUND });

      // 2) Auth (cascade if allow not specified; public is opt-in)
      const t0a = clock.now();
      const who = await authRegistry.authenticate(policy.allowedAuth, req, deps, policy);
      tAuth = clock.now() - t0a;

      // 3) Resource
      const t0r = clock.now();
      const resource = await resolver.resolve(req, deps, policy);
      if (!resource) throw new Problem(HTTP_STATUS.NOT_FOUND, { detail: ERRORS.RESOURCE_NOT_FOUND });
      tRes = clock.now() - t0r;

      if (isOutsidePathForm(req, resource)) {
        orchestratorLogger.warn({
          event: 'resource_path_form_mismatch',
          resourceFormId: resource.form?.id,
          method: req.method,
          path: req.path,
        });
        throw new Problem(HTTP_STATUS.NOT_FOUND, { detail: ERRORS.RESOURCE_NOT_FOUND });
      }

      // API keys and gateway tokens are scoped to one form. 404 so other form ids are not confirmed.
      if (isOutsideCredentialForm(who?.actor, resource)) {
        orchestratorLogger.warn({
          event: 'api_credential_form_mismatch',
          credentialFormId: who.actor.formId,
          resourceFormId: resource.form?.id,
          method: req.method,
          path: req.path,
        });
        throw new Problem(HTTP_STATUS.NOT_FOUND, { detail: ERRORS.RESOURCE_NOT_FOUND });
      }

      // Anonymous callers only reach forms that use the Public identity provider. 404 so other forms are not confirmed.
      if (isAnonymousOnNonPublicForm(who?.actor, resource)) {
        orchestratorLogger.warn({
          event: 'public_actor_non_public_form',
          resourceFormId: resource.form.id,
          method: req.method,
          path: req.path,
        });
        throw new Problem(HTTP_STATUS.NOT_FOUND, { detail: ERRORS.RESOURCE_NOT_FOUND });
      }

      // 3.5) Backward compatibility: Set req.currentUser and req.apiUser
      if (who?.actor) {
        req.currentUser = generateCurrentUserFromActor(who.actor);
        req.apiUser = isApiUser(who.actor);
      }

      // 4) RBAC (enrich context)
      const t0b = clock.now();
      const rbac = await enrichRBAC({
        policy,
        who,
        resource,
        currentUser: req.currentUser,
        apiUser: req.apiUser,
        deps,
      });
      tRbac = clock.now() - t0b;

      // Log RBAC enrichment performance
      securityLog.logPerformance(orchestratorLogger, 'enrichRBAC', tRbac, {
        actor: who?.actor?.id || 'unknown',
        actorType: who?.actor?.type || 'unknown',
        resourceKind: resource?.kind || 'none',
        permissionsGranted: rbac.permissions?.length || 0,
      });

      // 5) Validate permissions if policy requires it (mode 'all' by default)
      const requiredPerms = policy.requiredPermissions || [];
      let permissionValidationPerformed = false;
      let permissionValidationPassed = false;

      if (requiredPerms.length > 0) {
        permissionValidationPerformed = true;
        const result = validatePermissionsLogic(requiredPerms, rbac.permissions, 'all');
        if (!result.isValid) {
          // Log permission denial
          securityLog.logPermissionCheck(orchestratorLogger, who?.actor, requiredPerms, false, {
            missing: result.missing,
            granted: rbac.permissions,
            mode: 'all',
            policyPattern: policy.pattern,
          });

          throw new Problem(HTTP_STATUS.FORBIDDEN, {
            detail: ERRORS.MISSING_PERMISSIONS,
            required: requiredPerms,
            granted: rbac.permissions,
            missing: result.missing,
            mode: 'all',
            decisions: rbac.decisions,
          });
        }

        // Log successful permission check
        securityLog.logPermissionCheck(orchestratorLogger, who?.actor, requiredPerms, true, {
          policyPattern: policy.pattern,
        });
        permissionValidationPassed = true;
      }

      // 6) Assemble context & log summary
      const finishedAtMs = clock.now();
      const finishedAt = new Date(finishedAtMs).toISOString();

      const securityContext = {
        correlationId: cid,
        startedAt,
        finishedAt,
        route: {
          method: req.method,
          pattern: policy.pattern,
          path: req.path,
          query: req.query,
          classification: policy.classification,
        },
        who,
        resource,
        rbac,
        timings: {
          t_auth: tAuth,
          t_res: tRes,
          t_rbac: tRbac,
          total: finishedAtMs - startedAtMs,
        },
      };

      req.securityContext = securityContext;

      orchestratorLogger.info({
        event: permissionValidationPerformed ? 'orchestrator_permission_validation_complete' : 'orchestrator_permission_validation_deferred',
        method: req.method,
        path: req.path,
        pattern: policy.pattern,
        auth: who?.authType,
        actor: rbac?.actorId || who?.actor?.id || 'n/a',
        res: policy.resourceSpec?.kind || 'none',
        permissionValidationPerformed,
        ...(permissionValidationPerformed ? { permissionValidationPassed } : {}),
        t_auth: tAuth,
        t_res: tRes,
        t_rbac: tRbac,
        total: securityContext.timings.total,
      });

      return next();
    } catch (err) {
      const status = err.status || 500;

      orchestratorLogger.warn({
        event: 'request_error',
        method: req.method,
        path: req.path,
        pattern: req?.securityContext?.route?.pattern || 'n/a',
        status,
        error: err.message,
        t_auth: tAuth,
        t_res: tRes,
        t_rbac: tRbac,
        total: clock.now() - startedAtMs,
      });

      return next(err);
    }
  }

  return { middleware: run };
};
