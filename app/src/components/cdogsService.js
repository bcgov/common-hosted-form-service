const config = require('config');
const AxiosService = require('./axiosService');
const errorToProblem = require('./errorToProblem');
const log = require('./log')(module.filename);

const SERVICE = 'CDOGS';

class CdogsService extends AxiosService {
  constructor() {
    super({
      tokenUrl: config.get('serviceClient.commonServices.cdogs.tokenEndpoint'),
      clientId: config.get('serviceClient.commonServices.cdogs.clientId'),
      clientSecret: config.get('serviceClient.commonServices.cdogs.clientSecret'),
      apiUrl: config.get('serviceClient.commonServices.cdogs.endpoint'),
      serviceName: SERVICE,
      version: 'v2',
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

module.exports = new CdogsService();
