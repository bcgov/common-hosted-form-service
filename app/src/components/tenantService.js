const config = require('config');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const errorToProblem = require('./errorToProblem');
const SERVICE = 'TenantService';
const endpoint = config.get('cstar.endpoint');
const listUserTenantsPath = config.get('cstar.listUserTenantsPath');

class TenantService {
  async getCurrentUserTenants(req /*, authHeader */) {
    if (!req.currentUser || !req.currentUser.idpUserId) {
      return [];
    }
    try {
      const url = `${endpoint}${listUserTenantsPath.replace('{userId}', req.currentUser.idpUserId)}`;
      // Commented out: read from request header
      // const headers = {};
      // if (authHeader) {
      //   headers['Authorization'] = authHeader;
      // }

      // Read token from local file in the same folder
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
}

module.exports = new TenantService();
