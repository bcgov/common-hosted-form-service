const config = require('config');
const axios = require('axios');
const jwtService = require('./jwtService');
const SERVICE = 'TenantService';
const endpoint = config.get('cstar.endpoint');
const listUserTenantsPath = config.get('cstar.listUserTenantsPath');
const { Role } = require('../forms/common/models');
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
      throw new Error(`${SERVICE}: missing currentUser`);
    }
    if (!req.currentUser.idpUserId) {
      throw new Error(`${SERVICE}: missing currentUser.idpUserId`);
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

          const groups = await this.getUserTenantGroupsAndRoles(reqContext);
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

  async getUserTenantGroupsAndRoles(req) {
    if (!req || !req.currentUser) {
      throw new Error(`${SERVICE}: missing currentUser`);
    }
    if (!req.currentUser.idpUserId) {
      throw new Error(`${SERVICE}: missing currentUser.idpUserId`);
    }
    if (!req.currentUser.tenantId) {
      throw new Error(`${SERVICE}: missing currentUser.tenantId`);
    }

    const userId = req.currentUser.idpUserId.toUpperCase();
    const tenantId = req.currentUser.tenantId;
    const groupPath = config.get('cstar.listGroupsForUserForTenantPath');
    const url = `${endpoint}${groupPath.replace('{tenantId}', tenantId).replace('{userId}', userId)}`;
    const headers = this._getAuthHeaders(req);
    const { data } = await axios.get(url, { headers });
    return (data?.data?.groups || []).map((group) => ({
      id: group.id,
      name: group.name,
      roles: (group.sharedServiceRoles || []).filter((role) => role.enabled).map((role) => role.name),
    }));
  }

  async getGroupsForCurrentTenant(req) {
    if (!req || !req.currentUser) {
      throw new Error(`${SERVICE}: missing currentUser`);
    }
    if (!req.currentUser.tenantId) {
      throw new Error(`${SERVICE}: missing currentUser.tenantId`);
    }

    const tenantId = req.currentUser.tenantId;
    const groupPath = config.get('cstar.listGroupsForTenant');
    const url = `${endpoint}${groupPath.replace('{tenantId}', tenantId)}`;
    const headers = this._getAuthHeaders(req);
    const { data } = await axios.get(url, { headers });
    return data?.data?.groups || [];
  }

  /**
   * Get associated, missing, and available groups for a form within the user's tenant.
   * - associatedGroups: groups linked to the form and present in tenant source-of-truth
   * - missingGroups: groups linked to the form but no longer present in tenant source-of-truth
   * - availableGroups: groups in tenant not yet linked to the form
   */
  async getFormGroups(req, formId) {
    if (!req || !req.currentUser) {
      throw new Error(`${SERVICE}: missing currentUser`);
    }
    if (!req.currentUser.tenantId) {
      throw new Error(`${SERVICE}: missing currentUser.tenantId`);
    }
    if (!formId) {
      throw new Error(`${SERVICE}: missing formId`);
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
      throw new Error(`${SERVICE}: missing currentUser`);
    }
    if (!req.currentUser.tenantId) {
      throw new Error(`${SERVICE}: missing currentUser.tenantId`);
    }
    if (!formId) {
      throw new Error(`${SERVICE}: missing formId`);
    }
    if (!Array.isArray(groupIds)) {
      throw new Error(`${SERVICE}: groupIds must be an array`);
    }

    // 1. Check form exists
    const form = await Form.query().findById(formId);
    if (!form) throw new Error(`${SERVICE}: form not found`);

    // 2. Check form belongs to tenant
    const formTenant = await FormTenant.query().where({ formId, tenantId: req.currentUser.tenantId }).first();
    if (!formTenant) throw new Error(`${SERVICE}: form not in tenant`);

    // 3. Check user has a group with form_admin role
    const userGroups = await this.getUserTenantGroupsAndRoles(req);
    const hasFormAdmin = userGroups.some((g) => g.roles.includes('form_admin'));
    if (!hasFormAdmin) throw new Error(`${SERVICE}: insufficient permissions`);

    // 4. Remove existing group assignments for this form
    await FormGroup.query().delete().where({ formId });

    // 5. Insert new group assignments with generated UUIDs
    const rows = groupIds.map((groupId) => ({
      id: uuid.v4(),
      formId,
      groupId,
      createdBy: req.currentUser.usernameIdp,
    }));
    await FormGroup.query().insert(rows);

    return true;
  }

  /**
   * Get users for a specific tenant from CSTAR
   * @param {object} req - Express request object with currentUser and headers
   * @returns {Promise<Array>} Array of user objects
   */
  async getTenantUsers(req) {
    if (!req || !req.currentUser) {
      throw new Error(`${SERVICE}: missing currentUser`);
    }
    if (!req.currentUser.tenantId) {
      throw new Error(`${SERVICE}: missing currentUser.tenantId`);
    }

    const listTenantUsersPath = config.get('cstar.listTenantUsersPath');
    const url = `${endpoint}${listTenantUsersPath.replace('{tenantId}', req.currentUser.tenantId)}`;
    const headers = this._getAuthHeaders(req);
    const { data } = await axios.get(url, { headers });
    return data?.data?.users || data?.users || [];
  }
}

/**
 * Get user roles and permissions for a tenant-aware user.
 * @param {object} userInfo - User information object
 * @param {object} headers - Request headers for authentication
 * @returns {Promise<{roles: string[], permissions: string[]}>}
 */
async function getUserRolesAndPermissions(userInfo, headers = null) {
  if (!userInfo) {
    throw new Error(`${SERVICE}: missing userInfo`);
  }
  if (!userInfo.idpUserId) {
    throw new Error(`${SERVICE}: missing userInfo.idpUserId`);
  }
  if (!userInfo.tenantId) {
    throw new Error(`${SERVICE}: missing userInfo.tenantId`);
  }
  if (!headers) {
    throw new Error(`${SERVICE}: missing headers for tenant API authentication`);
  }

  // Fetch all roles with permissions directly from the DB
  const allRoles = await Role.query().withGraphFetched('permissions');

  // Create request-like object with headers for authentication
  const reqContext = { currentUser: userInfo, headers };
  const groups = await module.exports.getUserTenantGroupsAndRoles(reqContext);

  const userRoles = Array.isArray(groups) ? groups.flatMap((group) => group.roles) : [];
  const userRolesSet = new Set(userRoles);
  const userPermissions = allRoles.filter((role) => userRolesSet.has(role.code)).flatMap((role) => role.permissions.map((permission) => permission.code));

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
    throw new Error(`${SERVICE}: missing currentUser`);
  }

  const idpCode = req.currentUser?.idp?.toLowerCase();
  const tenantId = req.currentUser?.tenantId;

  if (idpCode !== 'idir') return false;
  if (!tenantId) return true;

  const groups = await module.exports.getUserTenantGroupsAndRoles(req);
  const hasFormAdmin = Array.isArray(groups) && groups.some((g) => Array.isArray(g.roles) && g.roles.includes('form_admin'));
  return hasFormAdmin;
}

/**
 * Returns true if the given formId is associated to the current user's tenant.
 * If the user has no tenantId, the caller should decide access (middleware allows).
 */
async function isFormInUsersTenant(req, formId) {
  if (!req || !req.currentUser) {
    throw new Error(`${SERVICE}: missing currentUser`);
  }

  const tenantId = req.currentUser?.tenantId;
  if (!tenantId) return true; // non-tenant users handled by caller/middleware
  if (!uuid.validate(formId)) return false;

  const ft = await FormTenant.query().where({ formId, tenantId }).first();
  return !!ft;
}

module.exports = Object.assign(new TenantService(), {
  getUserRolesAndPermissions,
  canCreateForm,
  isFormInUsersTenant,
});
