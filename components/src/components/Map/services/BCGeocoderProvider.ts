import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { EndpointArgument } from 'leaflet-geosearch/dist/providers/provider';

export class BCGeocoderProvider extends OpenStreetMapProvider {
  endpoint = ({ query, type }: EndpointArgument): string => {
    return this.getUrl(import.meta.env.VITE_CHEFS_GEO_ADDRESS_APIURL, {
      addressString: query as string,
    });
  };
  parse = ({ data }) => {
    return data.features
      .filter(function (feature) {
        if (!feature.geometry.coordinates) return false;
        if (feature.properties.fullAddress === 'BC') return false;
        return true;
      })
      .map(function (feature) {
        return {
          x: feature.geometry.coordinates[0],
          y: feature.geometry.coordinates[1],
          label: feature.properties.fullAddress,
          matchPrecision: feature.properties.matchPrecision,
          raw: feature,
        };
      });
  };
}
