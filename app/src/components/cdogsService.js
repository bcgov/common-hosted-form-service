const config = require('config');

const ClientConnection = require('./clientConnection');
const errorToProblem = require('./errorToProblem');
const log = require('./log')(module.filename);

const SERVICE = 'CDOGS';

class CdogsService {
  constructor({ tokenUrl, clientId, clientSecret, apiUrl }) {
    log.debug(`Constructed with ${tokenUrl}, ${clientId}, clientSecret, ${apiUrl}`, { function: 'constructor' });
    if (!tokenUrl || !clientId || !clientSecret || !apiUrl) {
      log.error('Invalid configuration.', { function: 'constructor' });
      throw new Error('CdogsService is not configured. Check configuration.');
    }
    this.connection = new ClientConnection({ tokenUrl, clientId, clientSecret });
    this.axios = this.connection.axios;
    this.apiUrl = apiUrl;
    this.apiV2 = `${this.apiUrl}/v2`;
  }

  async templateUploadAndRender(body) {
    try {
      const url = `${this.apiV2}/template/render`;
      log.debug(`POST to ${url}`, { function: 'templateUploadAndRender' });

      const { data, headers, status } = await this.axios.post(url, body, {
        responseType: 'arraybuffer', // Needed for binaries unless you want pain
      });

      return { data, headers, status };
    } catch (e) {
      errorToProblem(SERVICE, e);
    }
  }
}

const endpoint = config.get('serviceClient.commonServices.cdogs.endpoint');
const tokenEndpoint = config.get('serviceClient.commonServices.cdogs.tokenEndpoint');
const clientId = config.get('serviceClient.commonServices.cdogs.clientId');
const clientSecret = config.get('serviceClient.commonServices.cdogs.clientSecret');

let cdogsService = new CdogsService({ tokenUrl: tokenEndpoint, clientId: clientId, clientSecret: clientSecret, apiUrl: endpoint });
module.exports = cdogsService;
