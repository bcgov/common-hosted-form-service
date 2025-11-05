const ClientConnection = require('./clientConnection');
const log = require('./log')(module.filename);

class AxiosService {
  constructor({ tokenUrl, clientId, clientSecret, apiUrl, serviceName, version = 'v1' }) {
    log.debug(`Constructed with ${tokenUrl}, ${clientId}, clientSecret, ${apiUrl}`, { function: 'constructor' });

    if (!tokenUrl || !clientId || !clientSecret || !apiUrl) {
      log.error('Invalid configuration.', { function: 'constructor' });
      throw new Error(`${serviceName} is not configured. Check configuration.`);
    }

    this.connection = new ClientConnection({ tokenUrl, clientId, clientSecret });
    this.axios = this.connection.axios;
    this.apiUrl = apiUrl;
    this.serviceName = serviceName;
    this.version = version;
  }
}

module.exports = AxiosService;