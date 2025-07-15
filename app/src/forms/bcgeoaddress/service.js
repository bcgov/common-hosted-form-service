const geoAddressService = require('../../components/geoAddressService');

const service = {
  searchBCGeoAddress: async (query) => {
    let addresses = { features: [] };

    let searchAddresses = await geoAddressService.addressQuerySearch(query);

    if (searchAddresses?.features && Array.isArray(searchAddresses.features)) {
      searchAddresses.features.forEach((element) => {
        if (element?.properties?.fullAddress) {
          addresses.features.push({ geometry: { coordinates: element.geometry.coordinates }, properties: { fullAddress: element.properties.fullAddress } });
        }
      });
    }
    return addresses;
  },

  advanceSearchBCGeoAddress: async (query) => {
    return await geoAddressService.addressQuerySearch(query);
  },
};

module.exports = service;
