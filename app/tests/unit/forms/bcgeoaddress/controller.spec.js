const controller = require('../../../../src/forms/bcgeoaddress/controller');
const service = require('../../../../src/forms/bcgeoaddress/service');

const req = {
  query: { brief: true, autocomplete: true, matchAccuracy: 100, addressString: 25, url: 'test Url' },
};

describe('search BCGEO Address', () => {
  it('should call searchBCGeoAddress method ', async () => {
    let res = jest.fn();
    let next = jest.fn();
    service.searchBCGeoAddress = jest.fn().mockReturnValue({
      features: [
        {
          geometry: { coordinates: [-118.4683663, 49.0257091] },
          properties: { fullAddress: '25th St, Grand Forks, BC' },
        },
      ],
    });
    await controller.searchBCGeoAddress(req, res, next);
    expect(service.searchBCGeoAddress).toHaveBeenCalledTimes(1);
  });
});
describe('search BCGEO Address', () => {
  it('should call advancedSearchBCGeoAddress method ', async () => {
    let res = jest.fn();
    let next = jest.fn();
    service.searchBCGeoAddress = jest.fn().mockReturnValue({
      type: 'FeatureCollection',
      queryAddress: 25,
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', crs: { type: 'EPSG', properties: { code: 4326 } }, coordinates: [-118.4683663, 49.0257091] },
          properties: { fullAddress: '25th St, Grand Forks, BC', score: 61, matchPrecision: 'STREET', siteStatus: '' },
        },
      ],
    });
    await controller.searchBCGeoAddress(req, res, next);
    expect(service.searchBCGeoAddress).toHaveBeenCalledTimes(1);
  });
});
