
const geoAddressService = require('../../components/geoAddressService');

const service = {
  searchBCGeoAddress:async(query)=>{
    return geoAddressService.addressQuerySearch(query);
  }
};

module.exports = service;
