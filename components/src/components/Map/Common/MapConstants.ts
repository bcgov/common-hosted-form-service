export const BASE_LAYER_URLS = {
  OpenStreetMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  Satellite: 'https://{s}.satellite-provider.com/{z}/{x}/{y}.png',
  Topographic: 'https://{s}.topographic-provider.com/{z}/{x}/{y}.png',
  ESRIWorldImagery:
    'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

export const BASE_LAYER_ATTRIBUTIONS = {
  OpenStreetMap:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
  Satellite:
    '&copy; <a href="https://www.satellite-provider.com" target="_blank">Satellite Data Provider</a>',
  Topographic:
    '&copy; <a href="https://www.topographic-provider.com" target="_blank">Topographic Data Provider</a>',
  ESRIWorldImagery:
    '&copy; <a href="https://www.esri.com/" target="_blank">ESRI</a> contributors',
};
