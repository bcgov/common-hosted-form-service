const config = require('config');
const axios = require('axios');
const jwtService = require('./jwtService');
const SERVICE = 'TenantService';
const endpoint = config.get('cstar.endpoint');
const listUserTenantsPath = config.get('cstar.listUserTenantsPath');
const { TenantRoles } = require('../forms/common/constants');
const { Role, User } = require('../forms/common/models');
const Form = require('../forms/common/models/tables/form');
const FormGroup = require('../forms/common/models/tables/formGroup');
const FormTenant = require('../forms/common/models/tables/formTenant');
const uuid = require('uuid');

class TenantService {
  /**
   * Get authorization headers with Bearer token from request
   * @param {object} req - Express request object
   * @returns {object} Headers object with Authorization if token exists
   */
  _getAuthHeaders(req) {
    const token = jwtService.getBearerToken(req);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getCurrentUserTenants(req) {
    if (!req || !req.currentUser) {
      throw new TypeError(`${SERVICE}: missing currentUser`);
    }
    if (!req.currentUser.idpUserId) {
      throw new TypeError(`${SERVICE}: missing currentUser.idpUserId`);
    }
    const url = `${endpoint}${listUserTenantsPath.replace('{userId}', req.currentUser.idpUserId)}`;
    const headers = this._getAuthHeaders(req);
    try {
      const { data } = await axios.get(url, { headers });
      const tenants = data?.data?.tenants || [];
      if (!Array.isArray(tenants) || tenants.length === 0) return [];

      const tenantsWithRoles = await Promise.all(
        tenants.map(async (tenant) => {
          const tenantId = tenant?.id;
          if (!tenantId) return { ...tenant, roles: [] };

          const reqContext = {
            ...req,
            currentUser: { ...req.currentUser, tenantId },
            headers: req.headers,
          };

          const groups = await this.getUserTenantGroupsAndRoles(reqContext, tenantId);
          const roles = Array.isArray(groups) ? groups.flatMap((group) => group.roles || []) : [];
          return { ...tenant, roles: [...new Set(roles)] };
        })
      );

      return tenantsWithRoles;
    } catch (error) {
      const status = error?.response?.status;
      const isUnavailable = [502, 503, 504].includes(status);
      const isNetworkError = ['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT'].includes(error?.code);
      if (isUnavailable || isNetworkError) {
        req._tenantServiceDegraded = true;
        return [];
      }
      throw error;
    }
  }

  async getUserTenantGroupsAndRoles(req, tenantId) {
    if (!req || !req.currentUser) {
      throw new TypeError(`${SERVICE}: missing currentUser`);
    }
    if (!req.currentUser.idpUserId) {
      throw new TypeError(`${SERVICE}: missing currentUser.idpUserId`);
    }
    if (!tenantId) {
      throw new TypeError(`${SERVICE}: missing tenantId`);
    }
    if (typeof tenantId !== 'string' || !uuid.validate(tenantId)) {
      throw new TypeError(`${SERVICE}: invalid tenantId`);
    }

    const userId = req.currentUser.idpUserId;
    const groupPath = config.get('cstar.listGroupsForUserForTenantPath');
    const url = `${endpoint}${groupPath.replace('{tenantId}', tenantId).replace('{userId}', userId)}`;
    const headers = this._getAuthHeaders(req);
    const { data } = await axios.get(url, { headers });
    const groups = Array.isArray(data?.data?.groups) ? data.data.groups : [];
    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      roles: (group.sharedServiceRoles || []).filter((role) => role.isDeleted !== true).map((role) => role.name),
    }));
  }

  async getGroupsForCurrentTenant(req) {
    if (!req || !req.currentUser) {
      throw new TypeError(`${SERVICE}: missing currentUser`);
    }
    if (!req.currentUser.tenantId) {
      throw new TypeError(`${SERVICE}: missing currentUser.tenantId`);
    }

    const tenantId = req.currentUser.tenantId;
    const groupPath = config.get('cstar.listGroupsForTenant');
    const url = `${endpoint}${groupPath.replace('{tenantId}', tenantId)}`;
    const headers = this._getAuthHeaders(req);
    const { data } = await axios.get(url, { headers });
    return Array.isArray(data?.data?.groups) ? data.data.groups : [];
  }

  async _getTenantGroupsWithRolesForCurrentTenant(req) {
    const tenantGroups = await this.getGroupsForCurrentTenant(req);
    return tenantGroups.map((group) => ({
      id: group.id,
      name: group.name,
      roles: (group.sharedServiceRoles || []).filter((role) => role.isDeleted !== true).map((role) => role.name),
    }));
  }

  /**
   * Get associated, missing, and available groups for a form within the user's tenant.
   * - associatedGroups: groups linked to the form and present in tenant source-of-truth
   * - missingGroups: groups linked to the form but no longer present in tenant source-of-truth
   * - availableGroups: groups in tenant not yet linked to the form
   */
  async getFormGroups(req, formId) {
    if (!req || !req.currentUser) {
      throw new TypeError(`${SERVICE}: missing currentUser`);
    }
    if (!req.currentUser.tenantId) {
      throw new TypeError(`${SERVICE}: missing currentUser.tenantId`);
    }
    if (!formId) {
      throw new TypeError(`${SERVICE}: missing formId`);
    }

    // Ensure the form belongs to the user's tenant
    const formTenant = await FormTenant.query().where({ formId, tenantId: req.currentUser.tenantId }).first();
    if (!formTenant) throw new Error(`${SERVICE}: form not found in tenant`);

    // Associations from DB
    const formGroups = await FormGroup.query().where({ formId }).select('groupId');
    const associatedGroupIds = formGroups.map((fg) => fg.groupId);

    // Source of truth
    const allTenantGroups = await this.getGroupsForCurrentTenant(req);

    // Associated and present
    const associatedGroups = allTenantGroups
      .filter((g) => associatedGroupIds.includes(g.id))
      .map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        isAssociated: true,
      }));

    // Associated but missing from source-of-truth
    const missingGroupIds = associatedGroupIds.filter((id) => !allTenantGroups.some((g) => g.id === id));
    const missingGroups = missingGroupIds.map((id) => ({
      id,
      name: 'Group no longer available',
      description: 'This group may have been deleted from the tenant',
      isAssociated: true,
      isDeleted: true,
    }));

    // Available for association
    const availableGroups = allTenantGroups
      .filter((g) => !associatedGroupIds.includes(g.id))
      .map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        isAssociated: false,
      }));

    return { associatedGroups, missingGroups, availableGroups };
  }

  /**
   * Assigns groups to a form after validating permissions and ownership.
   * @param {object} req - Express request object with currentUser
   * @param {string} formId - UUID of the form
   * @param {string[]} groupIds - Array of group UUIDs
   * @returns {Promise<boolean>} true if successful, false otherwise
   */
  async assignGroupsToForm(req, formId, groupIds) {
    if (!req || !req.currentUser) {
      throw new TypeError(`${SERVICE}: missing currentUser`);
    }
    if (!req.currentUser.tenantId) {
      throw new TypeError(`${SERVICE}: missing currentUser.tenantId`);
    }
    if (!formId) {
      throw new TypeError(`${SERVICE}: missing formId`);
    }
    if (!Array.isArray(groupIds)) {
      throw new TypeError(`${SERVICE}: groupIds must be an array`);
    }

    // 1. Check form exists
    const form = await Form.query().findById(formId);
    if (!form) throw new Error(`${SERVICE}: form not found`);

    // 2. Check form belongs to tenant
    const formTenant = await FormTenant.query().where({ formId, tenantId: req.currentUser.tenantId }).first();
    if (!formTenant) throw new Error(`${SERVICE}: form not in tenant`);

    // 3. Check user has a group with form_admin role
    const userGroups = await this.getUserTenantGroupsAndRoles(req, req.currentUser.tenantId);
    const hasAccess = userGroups.some((g) => g.roles.includes(TenantRoles.FORM_ADMIN));
    if (!hasAccess) throw new Error(`${SERVICE}: insufficient permissions`);

    // 4. Ensure assigned groups are valid for this tenant
    const uniqueGroupIds = [...new Set(groupIds)];
    const tenantGroups = await this.getGroupsForCurrentTenant(req);
    const tenantGroupIds = new Set(tenantGroups.map((group) => group.id));
    const unknownGroupIds = uniqueGroupIds.filter((groupId) => !tenantGroupIds.has(groupId));
    if (unknownGroupIds.length > 0) {
      throw new Error(`${SERVICE}: invalid groupIds`);
    }

    // Use user group role data because tenant group listing may not include role details
    const userFormAdminGroupIds = new Set(userGroups.filter((group) => group.roles.includes(TenantRoles.FORM_ADMIN)).map((group) => group.id));
    const hasFormAdminGroup = uniqueGroupIds.some((groupId) => userFormAdminGroupIds.has(groupId));
    if (!hasFormAdminGroup) {
      throw new Error(`${SERVICE}: at least one assigned group must have form_admin role`);
    }

    // 5. Replace assignments atomically
    await FormGroup.transaction(async (trx) => {
      await FormGroup.query(trx).delete().where({ formId });
      const rows = uniqueGroupIds.map((groupId) => ({
        id: uuid.v4(),
        formId,
        groupId,
        createdBy: req.currentUser.usernameIdp,
      }));
      await FormGroup.query(trx).insert(rows);
    });

    return true;
  }

  /**
   * Check whether a target user belongs to one of the CSTAR groups assigned to
   * the given form.
   *
   * Returns null  → classic CHEFS form (no FormTenant record); caller should
   *                 fall back to the CHEFS team-membership check.
   * Returns true  → user is in at least one of the form's assigned groups, OR
   *                 the form is tenanted but has no specific group restrictions
   *                 (any tenant user is allowed).
   * Returns false → user is not in any of the form's groups (or lookup failed).
   *
   * Looks up the target user's idpUserId from the CHEFS DB and then queries
   * CSTAR for their group memberships in the form's tenant using the caller's
   * Bearer token. The caller holds FORM_READ so is at minimum a form admin.
   *
   * @param {object} req         - Express request (headers used for CSTAR auth)
   * @param {string} formId      - UUID of the form
   * @param {string} targetEmail - Email address of the user to check
   */
  async isUserInFormGroups(req, formId, targetEmail) {
    const [formGroups, formTenant] = await Promise.all([FormGroup.query().where('formId', formId).select('groupId'), FormTenant.query().where('formId', formId).first()]);

    if (!formGroups.length) {
      // Classic CHEFS form (no tenant record) → caller falls back to team-membership check.
      if (!formTenant) return null;
      // Tenanted form with no specific group restrictions → any tenant user is allowed.
      return true;
    }

    if (!formTenant) return null;

    try {
      const targetUser = await User.query().where('email', targetEmail).first();
      if (!targetUser?.idpUserId) return false;

      // GET /tenants/:tenantId/users?groupIds=<csv> — no :ssoUserId in URL,
      // so CSTAR's cross-user enforcement does not apply. Returns only users
      // that are members of the specified groups.
      const listTenantUsersPath = config.get('cstar.listTenantUsersPath');
      const url = `${endpoint}${listTenantUsersPath.replace('{tenantId}', formTenant.tenantId)}`;
      const groupIdsCsv = formGroups.map((fg) => fg.groupId).join(',');
      const { data } = await axios.get(url, { headers: this._getAuthHeaders(req), params: { groupIds: groupIdsCsv } });
      const usersInGroups = data?.data?.users || data?.users || [];
      return usersInGroups.some((u) => u?.ssoUser?.ssoUserId === targetUser.idpUserId);
    } catch {
      return false;
    }
  }

  /**
   * Fetch all users that belong to the tenant that owns the given form.
   * Uses the form's tenantId from form_tenant, so no currentUser.tenantId is
   * required — this works from the submit view where tenant context is absent.
   *
   * Returns null for classic CHEFS forms (no FormTenant record); caller should
   * fall back to the regular getFormUsers path. Tenanted forms — with or without
   * specific group assignments — return all tenant users.
   *
   * @param {object} req    - Express request (headers used for CSTAR auth)
   * @param {string} formId - UUID of the form
   */
  async getUsersForForm(req, formId) {
    const [formGroups, formTenant] = await Promise.all([FormGroup.query().where('formId', formId).select('groupId'), FormTenant.query().where('formId', formId).first()]);

    // Classic CHEFS form (no tenant record) → caller falls back to standard getFormUsers.
    if (!formGroups.length && !formTenant) return null;
    // No tenant record despite having groups — data inconsistency; skip CSTAR.
    if (!formTenant) return null;

    const reqForTenant = {
      ...req,
      currentUser: { ...req.currentUser, tenantId: formTenant.tenantId },
    };
    return this.getTenantUsers(reqForTenant);
  }

  /**
   * Get users for a specific tenant from CSTAR
   * @param {object} req - Express request object with currentUser and headers
   * @returns {Promise<Array>} Array of user objects
   */
  async getTenantUsers(req) {
    if (!req || !req.currentUser) {
      throw new TypeError(`${SERVICE}: missing currentUser`);
    }
    if (!req.currentUser.tenantId) {
      throw new TypeError(`${SERVICE}: missing currentUser.tenantId`);
    }

    const listTenantUsersPath = config.get('cstar.listTenantUsersPath');
    const url = `${endpoint}${listTenantUsersPath.replace('{tenantId}', req.currentUser.tenantId)}`;
    const headers = this._getAuthHeaders(req);
    const { data } = await axios.get(url, { headers });
    return data?.data?.users || data?.users || [];
  }
}

/**
 * Get user roles and permissions scoped to a specific form's assigned groups.
 * Filters the user's TMS groups to only those assigned to the form, then
 * deduplicates roles and resolves permissions from the DB.
 * @param {object} userInfo - User information object
 * @param {object} headers - Request headers for authentication
 * @param {string[]} formGroupIds - Group IDs assigned to the form (from form_group table)
 * @param {string} tenantId - Tenant ID for group lookup
 * @returns {Promise<{roles: string[], permissions: string[]}>}
 */
async function getUserRolesAndPermissionsForForm(userInfo, headers = null, formGroupIds = [], tenantId = null) {
  if (!userInfo) {
    throw new TypeError(`${SERVICE}: missing userInfo`);
  }
  if (!userInfo.idpUserId) {
    throw new TypeError(`${SERVICE}: missing userInfo.idpUserId`);
  }
  if (!headers) {
    throw new TypeError(`${SERVICE}: missing headers for tenant API authentication`);
  }
  if (!tenantId) {
    throw new TypeError(`${SERVICE}: missing tenantId`);
  }
  if (typeof tenantId !== 'string' || !uuid.validate(tenantId)) {
    throw new TypeError(`${SERVICE}: invalid tenantId`);
  }

  // Fetch all roles with permissions directly from the DB
  const allRoles = await Role.query().withGraphFetched('permissions');

  // Create request-like object with headers for authentication
  const reqContext = { currentUser: userInfo, headers };
  const userGroups = await module.exports.getUserTenantGroupsAndRoles(reqContext, tenantId);

  // Filter to only groups assigned to this form
  const formGroupIdSet = new Set(formGroupIds);
  const matchingGroups = Array.isArray(userGroups) ? userGroups.filter((group) => formGroupIdSet.has(group.id)) : [];

  const userRoles = [...new Set(matchingGroups.flatMap((group) => group.roles))];
  const userPermissions = allRoles.filter((role) => userRoles.includes(role.code)).flatMap((role) => role.permissions.map((permission) => permission.code));

  return {
    roles: userRoles,
    permissions: [...new Set(userPermissions)],
  };
}

/**
 * Returns true if the current user can create a form.
 * - Only IDIR users
 * - If tenantId exists, must have form_admin in that tenant
 * - If no tenantId, allowed (non-tenant form)
 * @param {object} req Express request with currentUser
 * @returns {Promise<boolean>}
 */
async function canCreateForm(req) {
  if (!req || !req.currentUser) {
    throw new TypeError(`${SERVICE}: missing currentUser`);
  }

  const idpCode = req.currentUser?.idp?.toLowerCase();
  const tenantId = req.currentUser?.tenantId;

  if (idpCode !== 'idir') return false;
  if (!tenantId) return true;

  const groups = await module.exports.getUserTenantGroupsAndRoles(req, tenantId);
  const hasFormAdmin = Array.isArray(groups) && groups.some((g) => Array.isArray(g.roles) && g.roles.includes(TenantRoles.FORM_ADMIN));
  return hasFormAdmin;
}

/**
 * Returns true if the given formId is associated to the current user's tenant.
 * If the user has no tenantId, the caller should decide access (middleware allows).
 */
async function isFormInUsersTenant(req, formId) {
  if (!req || !req.currentUser) {
    throw new TypeError(`${SERVICE}: missing currentUser`);
  }

  const tenantId = req.currentUser?.tenantId;
  if (!tenantId) return true; // non-tenant users handled by caller/middleware
  if (!uuid.validate(formId)) return false;

  const ft = await FormTenant.query().where({ formId, tenantId }).first();
  return !!ft;
}

module.exports = Object.assign(new TenantService(), {
  getUserRolesAndPermissionsForForm,
  canCreateForm,
  isFormInUsersTenant,
});
