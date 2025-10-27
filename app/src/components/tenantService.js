const config = require('config');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const errorToProblem = require('./errorToProblem');
const SERVICE = 'TenantService';
const endpoint = config.get('cstar.endpoint');
const listUserTenantsPath = config.get('cstar.listUserTenantsPath');
const { Role } = require('../forms/common/models'); // Import Role model directly
const Form = require('../forms/common/models/tables/form');
const FormGroup = require('../forms/common/models/tables/formGroup');
const FormTenant = require('../forms/common/models/tables/formTenant');
const uuid = require('uuid');

class TenantService {
  async getCurrentUserTenants(req) {
    if (!req.currentUser || !req.currentUser.idpUserId) {
      return [];
    }
    try {
      const url = `${endpoint}${listUserTenantsPath.replace('{userId}', req.currentUser.idpUserId)}`;
      let token = '';
      try {
        const tokenPath = path.join(__dirname, 'token.txt');
        token = fs.readFileSync(tokenPath, 'utf8').trim();
      } catch (err) {
        throw new Error('Authorization token file not found or unreadable');
      }
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const { data } = await axios.get(url, { headers });
      return data?.data?.tenants || [];
    } catch (e) {
      errorToProblem(SERVICE, e);
      return [];
    }
  }

  async getUserTenantGroupsAndRoles(req) {
    if (!req.currentUser || !req.currentUser.idpUserId || !req.currentUser.tenantId) {
      return [];
    }
    try {
      const userId = req.currentUser.idpUserId;
      const tenantId = req.currentUser.tenantId;
      const groupPath = config.get('cstar.listGroupsForUserForTenantPath');
      const url = `${endpoint}${groupPath.replace('{tenantId}', tenantId).replace('{userId}', userId)}`;
      let token = '';
      try {
        const tokenPath = path.join(__dirname, 'token.txt');
        token = fs.readFileSync(tokenPath, 'utf8').trim();
      } catch (err) {
        throw new Error('Authorization token file not found or unreadable');
      }
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const { data } = await axios.get(url, { headers });
      // Transform API response to array of groups with roles
      return (data?.data?.groups || []).map((group) => ({
        id: group.id,
        name: group.name,
        roles: (group.sharedServiceRoles || []).filter((role) => role.enabled).map((role) => role.name),
      }));
    } catch (e) {
      errorToProblem(SERVICE, e);
      return [];
    }
  }

  /**
   * Get list of groups for the current user's tenant from the API.
   * @param {object} req - Express request object with currentUser
   * @returns {Promise<Array>} Array of group objects
   */
  async getGroupsForCurrentTenant(req) {
    if (!req.currentUser || !req.currentUser.tenantId) {
      return [];
    }
    try {
      const tenantId = req.currentUser.tenantId;
      const groupPath = config.get('cstar.listGroupsForTenant');
      const url = `${endpoint}${groupPath.replace('{tenantId}', tenantId)}`;
      let token = '';
      try {
        const tokenPath = path.join(__dirname, 'token.txt');
        token = fs.readFileSync(tokenPath, 'utf8').trim();
      } catch (err) {
        throw new Error('Authorization token file not found or unreadable');
      }
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const { data } = await axios.get(url, { headers });
      return data?.data?.groups || [];
    } catch (e) {
      errorToProblem(SERVICE, e);
      return [];
    }
  }

  /**
   * Get associated, missing, and available groups for a form within the user's tenant.
   * - associatedGroups: groups linked to the form and present in tenant source-of-truth
   * - missingGroups: groups linked to the form but no longer present in tenant source-of-truth
   * - availableGroups: groups in tenant not yet linked to the form
   */
  async getFormGroups(req, formId) {
    const empty = { associatedGroups: [], missingGroups: [], availableGroups: [] };
    try {
      if (!req.currentUser?.tenantId) return empty;

      // Ensure the form belongs to the user's tenant
      const formTenant = await FormTenant.query().where({ formId, tenantId: req.currentUser.tenantId }).first();
      if (!formTenant) return empty;

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
    } catch (e) {
      errorToProblem(SERVICE, e);
      return { associatedGroups: [], missingGroups: [], availableGroups: [] };
    }
  }

  /**
   * Assigns groups to a form after validating permissions and ownership.
   * @param {object} req - Express request object with currentUser
   * @param {string} formId - UUID of the form
   * @param {string[]} groupIds - Array of group UUIDs
   * @returns {Promise<boolean>} true if successful, false otherwise
   */
  async assignGroupsToForm(req, formId, groupIds) {
    if (!req.currentUser || !req.currentUser.tenantId) return false;

    // 1. Check form exists
    const form = await Form.query().findById(formId);
    if (!form) return false;

    // 2. Check form belongs to tenant
    const formTenant = await FormTenant.query().where({ formId, tenantId: req.currentUser.tenantId }).first();
    if (!formTenant) return false;

    // 3. Check user has a group with form_admin role
    const userGroups = await this.getUserTenantGroupsAndRoles(req);
    const hasFormAdmin = userGroups.some((g) => g.roles.includes('form_admin'));
    if (!hasFormAdmin) return false;

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
}

/**
 * Get user roles and permissions for a tenant-aware user.
 * @param {object} userInfo
 * @returns {Promise<{roles: string[], permissions: string[]}>}
 */
async function getUserRolesAndPermissions(userInfo) {
  // Fetch all roles with permissions directly from the DB
  const allRoles = await Role.query().withGraphFetched('permissions');
  const groups = await module.exports.getUserTenantGroupsAndRoles({ currentUser: userInfo });
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
  try {
    const tenantId = req.currentUser?.tenantId;
    if (!tenantId) return true; // non-tenant users handled by caller/middleware
    if (!uuid.validate(formId)) return false;

    const ft = await FormTenant.query().where({ formId, tenantId }).first();
    return !!ft;
  } catch (e) {
    errorToProblem(SERVICE, e);
    return false;
  }
}

module.exports = Object.assign(new TenantService(), {
  getUserRolesAndPermissions,
  canCreateForm,
  isFormInUsersTenant,
});
