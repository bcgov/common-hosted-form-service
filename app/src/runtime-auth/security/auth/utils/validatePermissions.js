/**
 * Shared permission validation logic
 * Used by both orchestrator and requirePermissions middleware
 *
 * @param {Array} requiredPermissions - Permissions that are required
 * @param {Array} grantedPermissions - Permissions that are granted
 * @param {String} mode - 'all' (default) or 'any'
 * @returns {Object} { isValid, missing }
 */
function validatePermissionsLogic(requiredPermissions, grantedPermissions, mode = 'all') {
  const required = Array.isArray(requiredPermissions) ? requiredPermissions : [];
  const granted = Array.isArray(grantedPermissions) ? grantedPermissions : [];

  if (required.length === 0) {
    return { isValid: true, missing: [] };
  }

  let isValid = false;
  if (mode === 'any') {
    // At least one permission must be present
    isValid = required.some((perm) => granted.includes(perm));
  } else {
    // Default 'all' mode: all permissions must be present
    isValid = required.every((perm) => granted.includes(perm));
  }

  const missing = required.filter((perm) => !granted.includes(perm));

  return { isValid, missing };
}

module.exports = { validatePermissionsLogic };
