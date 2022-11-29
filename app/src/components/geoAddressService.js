const config = require('config');
const axios = require('axios');

const errorToProblem = require('./errorToProblem');
const log = require('./log')(module.filename);

const SERVICE = 'GeoAddressService';

class GeoAddressService {
  constructor({ apiKey, bcAddressURL,queryParameters }) {
    log.debug(`Constructed with apiKey, ${bcAddressURL}, ${queryParameters}`, { function: 'constructor' });
    if (!apiKey || !bcAddressURL || !queryParameters ) {
      log.error('Invalid configuration.', { function: 'constructor' });
      throw new Error('GeoAddressService is not configured. Check configuration.');
    }

    this.apiUrl = bcAddressURL;
    this.apiKey=apiKey;
    this.queryParameters = queryParameters;
  }

  async addressQuerySearch(query) {
    try {
      let preferUrl = query.bcGeoAddressURL;
      delete query.bcGeoAddressURL;

      const url = !preferUrl || (preferUrl===this.apiUrl)?this.apiUrl:preferUrl;
      const queryParameters = {...query, ...this.queryParameters };

      log.debug(`Get to ${url}`, { function: 'addressQuerySearch' });

      axios.defaults.headers['X-API-KEY'] = this.apiKey;
      const {data} = await axios.get(url, { params: { ...queryParameters } });
      return data;
    } catch (e) {
      errorToProblem(SERVICE, e);
    }
  }

}
//
const apiKey = config.get('customBcAddressFormioComponent.apikey');
const bcAddressURL = config.get('customBcAddressFormioComponent.bcAddressURL');
const queryParameters = config.get('customBcAddressFormioComponent.queryParameters');

let geoAddressService = new GeoAddressService({apiKey: apiKey, bcAddressURL: bcAddressURL, queryParameters:queryParameters,});
module.exports = geoAddressService;
