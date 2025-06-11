export const BASE_LAYER_URLS = {
  OpenStreetMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  Topographic: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  Light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  Dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  };

export const BASE_LAYER_ATTRIBUTIONS = {
  OpenStreetMap:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
  Topographic:
    'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
  BC_BASEMAP:
    '&copy; <a href="https://www2.gov.bc.ca/" target="_blank">Ministry of Land, Water, and Resource Stewardship - GeoBC Branch</a>',
  CARTO:'&copy; OpenStreetMap contributors &copy; CARTO',
  GEO_BC:'&copy; Government of British Columbia, Data from <a href="https://openmaps.gov.bc.ca" target="_blank">GeoBC</a>'
};

export const DEFAULT_BASE_LAYER= 'OpenStreetMap';
export const DEFAULT_MAP_ZOOM = 5;
export const DECIMALS_LATLNG = 5; // the number of decimals of latitude and longitude to be displayed in the marker popup
export const COMPONENT_EDIT_CLASS = 'component-edit-tabs';
export const CUSTOM_MARKER_PATH = 'https://unpkg.com/leaflet@1.9.4/dist/images/';
export const MAP_INIT_DELAY = 100;
export const MAX_INIT_ATTEMPTS = 3;
export const DEFAULT_AVAILABLE_BASELAYERS = {
  OpenStreetMap: true,
  Light: true,
  Dark: true,
  Topographic: true,
};
export const DEFAULT_CENTER: [number, number] = [
  53.96717190097409, -123.98320425388914,
];
export const DEFAULT_CONTAINER_HEIGHT = '400px';
export const tabComponentKeys = ['tabs', 'simpletabs']; // Add all keys you use
