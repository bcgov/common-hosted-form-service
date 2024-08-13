const axios = require('axios');
const oauth = require('axios-oauth-client');
const tokenProvider = require('axios-token-interceptor');

const log = require('./log')(module.filename);

// axios-oauth-client removed the "interceptor" in v2.2.0. Replicate it here.

const _getMaxAge = (res) => {
  return res.expires_in * 1e3;
};

const _headerFormatter = (res) => {
  return 'Bearer ' + res.access_token;
};

const _interceptor = (tokenProvider, authenticate) => {
  const getToken = tokenProvider.tokenCache(authenticate, { _getMaxAge });

  return tokenProvider({ getToken, _headerFormatter });
};

class ClientConnection {
  constructor({ tokenUrl, clientId, clientSecret }) {
    log.verbose(`Constructed with ${tokenUrl}, ${clientId}, clientSecret`, { function: 'constructor' });
    if (!tokenUrl || !clientId || !clientSecret) {
      log.error('Invalid configuration.', { function: 'constructor' });
      throw new Error('ClientConnection is not configured. Check configuration.');
    }

    this.tokenUrl = tokenUrl;

    this.axios = axios.create();
    this.axios.interceptors.request.use(
      // Wraps axios-token-interceptor with oauth-specific configuration,
      // fetches the token using the desired claim method, and caches
      // until the token expires
      _interceptor(tokenProvider, oauth.clientCredentials(axios.create(), tokenUrl, clientId, clientSecret))
    );
  }
}

module.exports = ClientConnection;
