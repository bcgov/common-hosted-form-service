const Problem = require('api-problem');
const config = require('config');
const AxiosService = require('./axiosService');
const log = require('./log')(module.filename);

const SERVICE = 'CHES';

class ChesService extends AxiosService {
  constructor() {
    super({
      tokenUrl: config.get('serviceClient.commonServices.ches.tokenEndpoint'),
      clientId: config.get('serviceClient.commonServices.ches.clientId'),
      clientSecret: config.get('serviceClient.commonServices.ches.clientSecret'),
      apiUrl: config.get('serviceClient.commonServices.ches.endpoint'),
      serviceName: SERVICE,
      version: 'v1',
    });
  }

  async health() {
    try {
      const response = await this.axios.get(`${this.getBaseUrl()}/health`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (e) {
      this.chesError(e, 'healthcheck');
    }
  }

  async statusQuery(params) {
    try {
      const response = await this.axios.get(`${this.getBaseUrl()}/status`, {
        params: params,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (e) {
      this.chesError(e, 'status');
    }
  }

  async cancelMsg(msgId) {
    try {
      const response = await this.axios.delete(`${this.getBaseUrl()}/cancel/${msgId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (e) {
      this.chesError(e, 'cancelMsg', msgId);
    }
  }

  async cancelQuery(params) {
    try {
      const response = await this.axios.delete(`${this.getBaseUrl()}/cancel`, {
        params: params,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (e) {
      this.chesError(e, 'cancelQuery');
    }
  }

  async send(email) {
    try {
      const response = await this.axios.post(`${this.getBaseUrl()}/email`, email, {
        headers: {
          'Content-Type': 'application/json',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      return response.data;
    } catch (e) {
      this.chesError(e, 'send');
    }
  }

  async merge(data) {
    // eslint-disable-next-line no-console
    try {
      const response = await this.axios.post(`${this.getBaseUrl()}/emailMerge`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      return response.data;
    } catch (e) {
      this.chesError(e, 'emailMerge');
    }
  }

  async preview(data) {
    try {
      const response = await this.axios.post(`${this.getBaseUrl()}/emailMerge/preview`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      return response.data;
    } catch (e) {
      this.chesError(e, 'emailMerge.preview');
    }
  }
  chesError(e, endpoint, msgId) {
    if (e.response) {
      const status = e.response.status;
      const errorData = JSON.stringify(e.response.data);
      if (status === 422) {
        log.warn(`Validation Error during ${SERVICE + '.' + endpoint}. ${SERVICE} returned status ${status} - ${msgId ? 'messageID: ' + msgId : ''} - ${errorData}`);
        throw new Problem(status, { message: 'Validation Failed', details: e.response.data });
      } else {
        log.error(`Error During ${SERVICE}.${endpoint} . ${SERVICE} returned status = ${e.response.status} ${msgId ? 'messageID: ' + msgId : ''} - ${errorData}`);
      }
      throw new Problem(status, e.response.data);
    }
  }
}

module.exports = new ChesService();
