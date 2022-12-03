const service = require('../../../../src/forms/bcgeoaddress/service');
const geoAddressService = require('../../../../src/components/geoAddressService');

describe('searchBCGeoAddress', () => {
  it('should handle a blank everything', async() => {

    let response = {'type':'FeatureCollection','queryAddress':25,'features':[{'type':'Feature','geometry':{'type':'Point','crs':{'type':'EPSG','properties':{'code':4326}},'coordinates':[-118.4683663,49.0257091]},'properties':{'fullAddress':'25th St, Grand Forks, BC','score':61,'matchPrecision':'STREET','siteStatus':''}}]};

    geoAddressService.addressQuerySearch = jest.fn().mockReturnValue(response);

    const query= { brief:true,autocomplete:true,matchAccuracy:100,addressString:25, url:'test Url' };

    const result = await service.searchBCGeoAddress(query);

    expect(geoAddressService.addressQuerySearch).toHaveBeenCalledTimes(1);

    expect(result).toEqual(response);
  });
});

