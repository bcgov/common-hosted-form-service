const service = require('./service');
const jwtService = require('../../components/jwtService');
const axios = require('axios');
const { ExternalAPIStatuses } = require('../common/constants');
const Problem = require('api-problem');
const ProxyServiceError = require('./error');
const { NotFoundError } = require('objection');
const log = require('../../components/log')(module.filename);

module.exports = {
  generateProxyHeaders: async (req, res, next) => {
    try {
      const response = await service.generateProxyHeaders(req.body, req.currentUser, jwtService.getBearerToken(req));
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  callExternalApi: async (req, res, next) => {
    try {
      // read the encrypted headers and parse them...
      const proxyHeaderInfo = await service.readProxyHeaders(req.headers);
      // find the specified external api configuration...
      const extAPI = await service.getExternalAPI(req.headers, proxyHeaderInfo);
      // add path to endpoint url if included in headers...
      const extUrl = service.createExternalAPIUrl(req.headers, extAPI.endpointUrl);
      // build list of request headers based on configuration...
      const extHeaders = await service.createExternalAPIHeaders(extAPI, proxyHeaderInfo);
      // check for approval before we call it..
      if (extAPI.code != ExternalAPIStatuses.APPROVED) {
        throw new Problem(407, 'External API has not been approved by CHEFS.');
      }
      let axiosInstance = axios.create({
        headers: extHeaders,
      });
      // call the external api
      const { data, status } = await axiosInstance.get(extUrl).catch(function (err) {
        let message = err.message;
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          log.warn(`Error returned from the external API': ${message}`);
        } else if (err.request) {
          message = 'External API call made, no response received.';
          log.warn(message);
        } else {
          // Something happened in setting up the request that triggered an Error
          log.warn(`Error setting up the external API request:  ${message}`);
        }
        // send a bad gateway, the message should contain the real status
        throw new Problem(502, message);
      });
      // if all good return data
      res.status(status).json(data);
    } catch (error) {
      if (error instanceof ProxyServiceError) {
        // making an assumption that the form component making this call
        // has not been setup correctly yet.
        // formio components will call as soon as the URL is entered while designing.
        // calls will fire before the designer has added the headers.
        log.warn(error.message);
        // send back status 400 Bad Request
        res.sendStatus(400);
      } else if (error instanceof NotFoundError) {
        // may have created formio component before adding the External API config.
        log.warn('External API configuration does not exist.');
        // send back status 400 Bad Request
        res.sendStatus(400);
      } else {
        next(error);
      }
    }
  },
};
