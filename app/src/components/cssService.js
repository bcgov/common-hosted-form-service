const config = require('config');

const ClientConnection = require('./clientConnection');
const errorToProblem = require('./errorToProblem');
const log = require('./log')(module.filename);

const SERVICE = 'Css';

class CssService {
  constructor({ tokenUrl, clientId, clientSecret, apiUrl }) {
    log.debug(`Constructed with ${tokenUrl}, ${clientId}, clientSecret, ${apiUrl}`, { function: 'constructor' });
    if (!tokenUrl || !clientId || !clientSecret || !apiUrl) {
      log.error('Invalid configuration.', { function: 'constructor' });
      throw new Error('CssService is not configured. Check configuration.');
    }
    this.connection = new ClientConnection({ tokenUrl, clientId, clientSecret });
    this.axios = this.connection.axios;
    this.apiUrl = apiUrl;
    this.apiV1 = `${this.apiUrl}/v1`;
  }

  async queryIdirUsers({ email, firstName, lastName, guid }) {
    try {
      const url = `${this.apiV1}/${environment}/idir/users`;

      const response = await this.axios.get(url, {
        params: { email, firstName, lastName, guid },
      });
      return response.data;
    } catch (e) {
      errorToProblem(SERVICE, e);
    }
  }
}

const endpoint = config.get('serviceClient.commonServices.css.endpoint');
const tokenEndpoint = config.get('serviceClient.commonServices.css.tokenEndpoint');
const clientId = config.get('serviceClient.commonServices.css.clientId');
const clientSecret = config.get('serviceClient.commonServices.css.clientSecret');
const environment = config.get('serviceClient.commonServices.css.environment');

let cssService = new CssService({ tokenUrl: tokenEndpoint, clientId: clientId, clientSecret: clientSecret, apiUrl: endpoint });
module.exports = cssService;
