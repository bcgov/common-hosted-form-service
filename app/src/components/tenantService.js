const config = require('config');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const errorToProblem = require('./errorToProblem');
const SERVICE = 'TenantService';
const endpoint = config.get('cstar.endpoint');
const listUserTenantsPath = config.get('cstar.listUserTenantsPath');
const { Role } = require('../forms/common/models'); // Import Role model directly

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

module.exports = Object.assign(new TenantService(), {
  getUserRolesAndPermissions,
});
