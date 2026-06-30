/**
 * Unified permission checking middleware
 * Replaces validatePermissions and checkPermission
 *
 * @param {String|Array} permissions - Single permission or array to check (or options object)
 * @param {String} mode - 'all' (default) or 'any'
 *
 * Usage:
 *   // Check single permission (default 'all' mode)
 *   app.get('/route', authMiddleware, requirePermissions(Permissions.SUBMISSION_UPDATE), handler);
 *
 *   // Check array of permissions (default 'all' mode)
 *   app.get('/route', authMiddleware, requirePermissions([P.FORM_READ, P.FORM_UPDATE]), handler);
 *
 *   // Check with 'any' mode
 *   app.get('/route', authMiddleware, requirePermissions([P.FORM_READ, P.FORM_UPDATE], 'any'), handler);
 *
 *   // Check single permission with 'any' mode
 *   app.get('/route', authMiddleware, requirePermissions(P.FORM_READ, 'any'), handler);
 */
const Problem = require('api-problem');
const { HTTP_STATUS } = require('../httpStatus');
const ERRORS = require('../errorMessages');
const { validatePermissionsLogic } = require('../auth/utils/validatePermissions');
const securityLog = require('../logger');

const requirePermissionsLogger = securityLog.requirePermissions;

module.exports = function requirePermissions(permissionsOrOptions, mode = 'all') {
  let requiredPermissions = [];
  let validationMode = 'all';

  // Handle different calling patterns
  if (typeof permissionsOrOptions === 'string') {
    // Single permission
    requiredPermissions = [permissionsOrOptions];
    validationMode = mode;
  } else if (Array.isArray(permissionsOrOptions)) {
    // Array of permissions
    requiredPermissions = permissionsOrOptions;
    validationMode = mode;
  } else if (typeof permissionsOrOptions === 'object' && permissionsOrOptions !== null) {
    // Options object: { mode: 'any' } or { perms: [...], mode: 'any' }
    if (permissionsOrOptions.perms || permissionsOrOptions.permissions) {
      requiredPermissions = Array.isArray(permissionsOrOptions.perms || permissionsOrOptions.permissions)
        ? permissionsOrOptions.perms || permissionsOrOptions.permissions
        : [permissionsOrOptions.perms || permissionsOrOptions.permissions];
      validationMode = permissionsOrOptions.mode || 'all';
    } else {
      // { mode: 'any' } - use policy's requiredPermissions
      validationMode = permissionsOrOptions.mode || 'all';
      requiredPermissions = null; // Will use from context
    }
  }

  return (req, res, next) => {
    const context = req.securityContext;

    if (!context?.rbac) {
      requirePermissionsLogger.error({
        event: 'permission_check_error',
        error: 'security_context_missing',
      });
      return next(new Problem(HTTP_STATUS.INTERNAL_SERVER_ERROR, { detail: ERRORS.SECURITY_CONTEXT_MISSING }));
    }

    // Determine which permissions to check
    const permsToCheck = requiredPermissions || context.rbac.required || [];

    if (permsToCheck.length === 0) {
      requirePermissionsLogger.debug({
        event: 'permission_check_skipped',
        reason: 'no_permissions_required',
      });
      // No permissions required, pass through
      return next();
    }

    const grantedPermissions = context.rbac.permissions || [];
    const actor = context.who?.actor;

    requirePermissionsLogger.info({
      event: 'permission_check_start',
      required: permsToCheck,
      mode: validationMode,
      actor: actor?.id || 'unknown',
    });

    // Use shared validation logic
    const result = validatePermissionsLogic(permsToCheck, grantedPermissions, validationMode);

    if (!result.isValid) {
      requirePermissionsLogger.warn({
        event: 'permission_check_denied',
        required: permsToCheck,
        granted: grantedPermissions,
        missing: result.missing,
        mode: validationMode,
      });

      return next(
        new Problem(HTTP_STATUS.FORBIDDEN, {
          detail: `${ERRORS.INSUFFICIENT_PERMISSIONS} (mode: ${validationMode})`,
          required: permsToCheck,
          granted: grantedPermissions,
          missing: result.missing,
          mode: validationMode,
          decisions: context.rbac.decisions,
        })
      );
    }

    requirePermissionsLogger.info({
      event: 'permission_check_passed',
      required: permsToCheck,
      mode: validationMode,
    });

    return next();
  };
};
