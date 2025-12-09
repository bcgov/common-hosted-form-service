const config = require('config');
const AxiosService = require('./axiosService');
const errorToProblem = require('./errorToProblem');
const log = require('./log')(module.filename);

const SERVICE = 'CSS';

const environment = config.get('serviceClient.commonServices.css.environment');

class CssService extends AxiosService {
  constructor() {
    super({
      tokenUrl: config.get('serviceClient.commonServices.css.tokenEndpoint'),
      clientId: config.get('serviceClient.commonServices.css.clientId'),
      clientSecret: config.get('serviceClient.commonServices.css.clientSecret'),
      apiUrl: config.get('serviceClient.commonServices.css.endpoint'),
      serviceName: SERVICE,
      version: 'v1',
    });
  }

  async queryIdirUsers({ email, firstName, lastName, guid }) {
    try {
      const url = `${this.getBaseUrl()}/${environment}/idir/users`;
      log.debug(`POST to ${url}`, { function: 'queryIdirUsers' });

      const response = await this.axios.get(url, {
        params: { email, firstName, lastName, guid },
      });

      return response.data;
    } catch (e) {
      errorToProblem(this.serviceName, e);
    }
  }
}

module.exports = new CssService();
