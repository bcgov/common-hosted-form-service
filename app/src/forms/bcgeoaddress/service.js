
const geoAddressService = require('../../components/geoAddressService');

const service = {
  searchBCGeoAddress:async(params)=>{
    return geoAddressService.addressQuerySearch(params);
  }
};

module.exports = service;
