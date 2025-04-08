const Problem = require('api-problem');
const config = require('config');

const ClientConnection = require('./clientConnection');
const log = require('./log')(module.filename);

const SERVICE = 'CHES';

class ChesService {
  constructor({ tokenUrl, clientId, clientSecret, apiUrl }) {
    log.debug(`Constructed with ${tokenUrl}, ${clientId}, clientSecret, ${apiUrl}`, { function: 'constructor' });
    if (!tokenUrl || !clientId || !clientSecret || !apiUrl) {
      log.error('Invalid configuration.', { function: 'constructor' });
      throw new Error('ChesService is not configured. Check configuration.');
    }
    this.connection = new ClientConnection({ tokenUrl, clientId, clientSecret });
    this.axios = this.connection.axios;
    this.apiUrl = apiUrl;
    this.apiV1 = `${this.apiUrl}/v1`;
  }

  async health() {
    try {
      const response = await this.axios.get(`${this.apiV1}/health`, {
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
      const response = await this.axios.get(`${this.apiV1}/status`, {
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
      const response = await this.axios.delete(`${this.apiV1}/cancel/${msgId}`, {
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
      const response = await this.axios.delete(`${this.apiV1}/cancel`, {
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
      const response = await this.axios.post(`${this.apiV1}/email`, email, {
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
      const response = await this.axios.post(`${this.apiV1}/emailMerge`, data, {
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
      const response = await this.axios.post(`${this.apiV1}/emailMerge/preview`, data, {
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

const endpoint = config.get('serviceClient.commonServices.ches.endpoint');
const tokenEndpoint = config.get('serviceClient.commonServices.ches.tokenEndpoint');
const clientId = config.get('serviceClient.commonServices.ches.clientId');
const clientSecret = config.get('serviceClient.commonServices.ches.clientSecret');

let chesService = new ChesService({ tokenUrl: tokenEndpoint, clientId: clientId, clientSecret: clientSecret, apiUrl: endpoint });
module.exports = chesService;
