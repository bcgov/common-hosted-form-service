export const BASE_LAYER_URLS = {
  OpenStreetMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  Satellite: 'https://{s}.satellite-provider.com/{z}/{x}/{y}.png',
  Topographic: 'https://{s}.topographic-provider.com/{z}/{x}/{y}.png',
  ESRIWorldImagery:
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  BC_BASEMAP:
    'https://tiles.arcgis.com/tiles/ubm4tcTYICKBpist/arcgis/rest/services/BC_BASEMAP_20240307/VectorTileServer',
  HILLSHADE:
    'https://tiles.arcgis.com/tiles/ubm4tcTYICKBpist/arcgis/rest/services/BC_Basemap_Vector_Hillshade/VectorTileServer',
  };

export const BASE_LAYER_ATTRIBUTIONS = {
  OpenStreetMap:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
  Satellite:
    '&copy; <a href="https://www.satellite-provider.com" target="_blank">Satellite Data Provider</a>',
  Topographic:
    '&copy; <a href="https://www.topographic-provider.com" target="_blank">Topographic Data Provider</a>',
  ESRIWorldImagery:
    'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  BC_BASEMAP:
    '&copy; <a href="https://www2.gov.bc.ca/" target="_blank">Ministry of Land, Water, and Resource Stewardship - GeoBC Branch</a>',
};
