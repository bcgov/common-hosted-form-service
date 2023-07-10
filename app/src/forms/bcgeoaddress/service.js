const geoAddressService = require('../../components/geoAddressService');

const service = {
  searchBCGeoAddress: async (query) => {
    let addresses = { features: [] };

    let searchAddresses = await geoAddressService.addressQuerySearch(query);
    if (searchAddresses?.features && Array.isArray(searchAddresses.features)) {
      await searchAddresses.features.forEach((element) => {
        if (element?.properties?.fullAddress) {
          addresses.features.push({ properties: { fullAddress: element.properties.fullAddress } });
        }
      });
    }
    return addresses;
  },
};

module.exports = service;
