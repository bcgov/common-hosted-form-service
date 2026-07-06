const axios = require('axios');

const ClientConnection = require('./clientConnection');
const log = require('./log')(module.filename);

class AxiosService {
  constructor({ tokenUrl, clientId, clientSecret, apiUrl, serviceName, version = 'v1' }) {
    log.debug(`Constructed with ${tokenUrl}, ${clientId}, clientSecret, ${apiUrl}`, { function: 'constructor' });

    if (!apiUrl) {
      log.error('Invalid configuration.', { function: 'constructor' });
      throw new Error(`${serviceName} is not configured. Check configuration.`);
    }

    // OAuth client-credentials mode when any auth setting is supplied; all three
    // must then be present. With no auth settings at all the service runs in
    // credential-less mode (plain axios, no token interceptor) for private or
    // unauthenticated endpoints (e.g. CDOGS v3 today). Adding creds later
    // transparently switches it back to authenticated mode.
    const authConfigured = tokenUrl || clientId || clientSecret;
    if (authConfigured) {
      if (!tokenUrl || !clientId || !clientSecret) {
        log.error('Invalid configuration.', { function: 'constructor' });
        throw new Error(`${serviceName} is not configured. Check configuration.`);
      }
      this.connection = new ClientConnection({ tokenUrl, clientId, clientSecret });
      this.axios = this.connection.axios;
    } else {
      this.axios = axios.create();
    }

    this.apiUrl = apiUrl;
    this.serviceName = serviceName;
    this.version = version;
  }

  getBaseUrl() {
    return `${this.apiUrl}/${this.version}`;
  }
}

module.exports = AxiosService;
