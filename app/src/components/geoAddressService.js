const config = require('config');
const axios = require('axios');

const errorToProblem = require('./errorToProblem');
const log = require('./log')(module.filename);

const SERVICE = 'GeoAddressService';

class GeoAddressService {
  constructor({ apiKey, bcAddressURL, queryProperty, responseProperty, displayValueProperty, queryParameters }) {
    log.debug(`Constructed with apiKey, ${bcAddressURL}, ${queryProperty}, ${responseProperty}, ${displayValueProperty}, ${queryParameters}`, { function: 'constructor' });
    if (!apiKey || !bcAddressURL || !queryProperty || !responseProperty || !displayValueProperty) {
      log.error('Invalid configuration.', { function: 'constructor' });
      throw new Error('GeoAddressService is not configured. Check configuration.');
    }

    this.apiUrl = bcAddressURL;
    this.responseProperty = responseProperty;
    this.displayValueProperty = displayValueProperty;
    this.queryParameters = queryParameters;
  }

  async addressQuerySearch({peferUrl, preferQueryProp,  preferQueryParams}) {
    try {

      const url = (peferUrl===this.apiUrl)?this.apiUrl:peferUrl;
      const queryParameters = {...preferQueryParams, ...this.queryParameters };
      log.debug(`Get to ${url}`, { function: 'addressQuerySearch' });
      const {data} = await axios.get(url, { params: { ...preferQueryProp,  ...queryParameters } });
      return data;
    } catch (e) {
      errorToProblem(SERVICE, e);
    }
  }

}

const apiKey = config.get('customBcAddressFormioComponent.apikey');
const bcAddressURL = config.get('customBcAddressFormioComponent.bcAddressURL');
const queryProperty = config.get('customBcAddressFormioComponent.queryProperty');
const responseProperty = config.get('customBcAddressFormioComponent.responseProperty');
const displayValueProperty = config.get('customBcAddressFormioComponent.displayValueProperty');
const queryParameters = config.get('customBcAddressFormioComponent.queryParameters');

let geoAddressService = new GeoAddressService({apiKey: apiKey, bcAddressURL: bcAddressURL, responseProperty: responseProperty,
  displayValueProperty: displayValueProperty, queryParameters:queryParameters, queryProperty:queryProperty});
module.exports = geoAddressService;
