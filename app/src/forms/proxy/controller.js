const service = require('./service');
const jwtService = require('../../components/jwtService');
const axios = require('axios');
const { ExternalAPIStatuses } = require('../common/constants');
const Problem = require('api-problem');

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
      if (extAPI.code != ExternalAPIStatuses.APPROVED) {
        throw new Problem(407, 'External API has not been approved by CHEFS.');
      }
      // add path to endpoint url if included in headers...
      const extUrl = service.createExternalAPIUrl(req.headers, extAPI.endpointUrl);
      // build list of request headers based on configuration...
      const extHeaders = await service.createExternalAPIHeaders(extAPI, proxyHeaderInfo);
      let axiosInstance = axios.create({
        headers: extHeaders,
      });
      // call the external api
      const { data } = await axiosInstance.get(extUrl);
      // if all good return data
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },
};
