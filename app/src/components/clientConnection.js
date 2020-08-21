const axios = require('axios');
const log = require('npmlog');
const oauth = require('axios-oauth-client');
const tokenProvider = require('axios-token-interceptor');

class ClientConnection {
  constructor({ tokenUrl, clientId, clientSecret }) {
    log.verbose('ClientConnection', `Constructed with ${tokenUrl}, ${clientId}, clientSecret`);
    if (!tokenUrl || !clientId || !clientSecret) {
      log.error('ClientConnection', 'Invalid configuration.');
      throw new Error('ClientConnection is not configured. Check configuration.');
    }

    this.tokenUrl = tokenUrl;

    this.axios = axios.create();
    this.axios.interceptors.request.use(
      // Wraps axios-token-interceptor with oauth-specific configuration,
      // fetches the token using the desired claim method, and caches
      // until the token expires
      oauth.interceptor(tokenProvider, oauth.client(axios.create(), {
        url: this.tokenUrl,
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: ''
      }))
    );
  }
}

module.exports = ClientConnection;
