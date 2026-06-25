const config = require('config');
const AxiosService = require('./axiosService');
const errorToProblem = require('./errorToProblem');
const log = require('./log')(module.filename);

const SERVICE = 'CDOGS';
const CDOGS_CONFIG_PATH = 'serviceClient.commonServices.cdogs';

const resolveConfig = (version) => {
  const scopedPath = `${CDOGS_CONFIG_PATH}.${version}`;
  const hasScopedEndpoint = config.has(`${scopedPath}.endpoint`);
  const isScopedV3 = version === 'v3' && hasScopedEndpoint;

  const endpoint = isScopedV3 ? config.get(`${scopedPath}.endpoint`) : config.get(`${CDOGS_CONFIG_PATH}.endpoint`);
  const tokenUrl = isScopedV3 ? undefined : config.get(`${CDOGS_CONFIG_PATH}.tokenEndpoint`);
  const clientId = isScopedV3 ? undefined : config.get(`${CDOGS_CONFIG_PATH}.clientId`);
  const clientSecret = isScopedV3 ? undefined : config.get(`${CDOGS_CONFIG_PATH}.clientSecret`);

  return { endpoint, tokenUrl, clientId, clientSecret };
};

class CdogsService extends AxiosService {
  constructor(version = 'v2') {
    const cdogsConfig = resolveConfig(version);

    super({
      tokenUrl: cdogsConfig.tokenUrl,
      clientId: cdogsConfig.clientId,
      clientSecret: cdogsConfig.clientSecret,
      apiUrl: cdogsConfig.endpoint,
      serviceName: SERVICE,
      version: version,
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

const cdogsService = new CdogsService();
cdogsService.v3 = new CdogsService('v3');

module.exports = cdogsService;
