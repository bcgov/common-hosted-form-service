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

    // If auth credentials are provided, all three must be present
    if ((tokenUrl || clientId || clientSecret) && (!tokenUrl || !clientId || !clientSecret)) {
      log.error('Invalid configuration.', { function: 'constructor' });
      throw new Error(`${serviceName} is not configured. Check configuration.`);
    }

    if (tokenUrl && clientId && clientSecret) {
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
