const config = require('config');
const AxiosService = require('./axiosService');
const errorToProblem = require('./errorToProblem');
const log = require('./log')(module.filename);

const SERVICE = 'CDOGS';

class CdogsV3Service extends AxiosService {
  constructor() {
    // CDOGS v3 (Carbone Enterprise) currently lives behind a private URL with no
    // token endpoint or credentials, so only the endpoint is configured. When auth
    // is introduced, add tokenEndpoint/clientId/clientSecret here and AxiosService
    // switches to authenticated mode automatically.
    super({
      apiUrl: config.get('serviceClient.commonServices.cdogsV3.endpoint'),
      serviceName: SERVICE,
      version: 'v3',
    });
  }

  async templateUploadAndRender(body) {
    try {
      const url = `${this.getBaseUrl()}/template/render`;
      log.debug(`POST to ${url}`, { function: 'templateUploadAndRender' });

      const { data, headers, status } = await this.axios.post(url, body, {
        responseType: 'arraybuffer', // Needed for binaries unless you want pain
      });

      return { data, headers, status };
    } catch (e) {
      errorToProblem(this.serviceName, e);
    }
  }
}

module.exports = new CdogsV3Service();
