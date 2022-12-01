const config = require('config');
const axios = require('axios');
const errorToProblem = require('./errorToProblem');
const SERVICE = 'GeoAddressService';


class GeoAddressService {
  constructor({ apiKey, bcAddressURL,queryParameters }) {
    if (!apiKey || !bcAddressURL || !queryParameters ) {
      throw new Error('GeoAddressService is not configured. Check configuration.');
    }

    this.apiUrl = bcAddressURL;
    this.apiKey=apiKey;
    this.queryParameters = queryParameters;
  }

  async addressQuerySearch(query) {
    try {
      //let preferUrl = query.bcGeoAddressURL;
      delete query.bcGeoAddressURL;

      const queryParameters = {...query, ...this.queryParameters };

      axios.defaults.headers['X-API-KEY'] = this.apiKey;


      const {data} = await axios.get(config.get('customBcAddressFormioComponent.bcAddressURL'), { params: { ...queryParameters } });

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
