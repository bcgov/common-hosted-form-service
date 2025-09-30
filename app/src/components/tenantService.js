const config = require('config');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const errorToProblem = require('./errorToProblem');
const SERVICE = 'TenantService';
const endpoint = config.get('cstar.endpoint');
const listUserTenantsPath = config.get('cstar.listUserTenantsPath');

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

module.exports = new TenantService();
