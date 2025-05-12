import { Components } from 'formiojs';
import MapService from './services/MapService';
import baseEditForm from './Component.form';
import * as L from 'leaflet';
import { DEFAULT_BASE_LAYER } from './Common/MapConstants';

const FieldComponent = (Components as any).components.field;

const DEFAULT_CENTER: [number, number] = [53.96717190097409, -123.98320425388914];
const DEFAULT_CONTAINER_HEIGHT = '400px';

export default class Component extends (FieldComponent as any) {
  static schema(...extend) {
    return FieldComponent.schema({
      type: 'map',
      label: 'Map',
      key: 'map',
      input: true,
      defaultValue: { features: [], selectedBaseLayer: DEFAULT_BASE_LAYER },
      allowBaseLayerSwitch: false,
      availableBaseLayers: {
        OpenStreetMap: true,
        Light: true,
        Dark: true,
        Topographic: true,
      },
      availableBaseLayersCustom: [],
      ...extend,
    });
  }

  static get builderInfo() {
    return {
      title: 'Map',
      group: 'basic',
      icon: 'map',
      weight: 70,
      schema: Component.schema(),
    };
  }

  static editForm = baseEditForm;

  componentID: string;
  mapService: MapService | null = null;
  initialized = false;
  mapContainer: HTMLElement | null = null;
  mapInitializationAttempts = 0;
  maxInitializationAttempts = 3;
  updatingFromMapService = false;
  skipNextUpdate = false;
  lastSavedValue: string | null = null;

  constructor(component, options, data) {
    super(component, options, data);
    this.componentID = super.elementInfo().component.id;
  }

  render() {
    return super.render(`<div id="map-${this.componentID}" style="height:${DEFAULT_CONTAINER_HEIGHT}; z-index:1;"></div>`);
  }

  attach(element) {
    const superAttach = super.attach(element);
    this.mapInitializationAttempts = 0;
    this.cleanupMap();
    setTimeout(() => this.tryLoadMap(), 100);
    return superAttach;
  }

  tryLoadMap() {
    try {
      this.loadMap();
    } catch (error) {
      console.error('Error loading map:', error);
      const mapContainer = document.getElementById(`map-${this.componentID}`);
      if (mapContainer) {
        mapContainer.innerHTML = '<div class="alert alert-danger">Error loading map. Please check console for details.</div>';
      }
    }
  }

  cleanupMap() {
    try {
      this.mapService?.cleanup?.();
    } catch (error) {
      console.error('Error cleaning up map:', error);
    }
    this.mapService = null;
    this.initialized = false;
  }

  loadMap() {
    this.mapContainer = document.getElementById(`map-${this.componentID}`);

    if (!this.mapContainer) {
      if (this.mapInitializationAttempts++ < this.maxInitializationAttempts) {
        setTimeout(() => this.loadMap(), 200);
      } else {
        console.error(`Map container with ID map-${this.componentID} not found`);
      }
      return;
    }

    // Check if container already has a map instance
    if (this.mapContainer._leaflet_id) {
      // console.log('Map container already has a map. Cleaning up first.');
      this.cleanupMap();

      // Delete the leaflet ID from the container element
      delete this.mapContainer._leaflet_id;
    }

    const {
      numPoints = 1,
      defaultZoom,
      allowSubmissions,
      center,
      defaultValue,
      myLocation,
      bcGeocoder,
      allowBaseLayerSwitch,
      availableBaseLayers,
      availableBaseLayersCustom,
      markerType,
    } = this.component;

    const drawOptions = this.getDrawOptions(markerType);
    const viewMode = this.options.readOnly;

    const initialCenter = center?.features?.[0]?.coordinates || DEFAULT_CENTER;
    const selectedBaseLayer = this.dataValue?.selectedBaseLayer || DEFAULT_BASE_LAYER;

    const effectiveDefaultValue = this.dataValue?.features ? this.dataValue : defaultValue?.features ? defaultValue : { features: [], selectedBaseLayer };

    this.lastSavedValue = this.serializeValue(effectiveDefaultValue);

    this.mapService = new MapService({
      mapContainer: this.mapContainer,
      drawOptions,
      center: initialCenter,
      form: document.getElementsByClassName('formio'),
      numPoints,
      defaultZoom,
      readOnlyMap: !allowSubmissions,
      defaultValue: effectiveDefaultValue,
      onDrawnItemsChange: this.saveDrawnItems.bind(this),
      viewMode,
      myLocation,
      bcGeocoder,
      selectedBaseLayer,
      onBaseLayerChange: (layerName) => this.saveBaseLayer(layerName),
      allowBaseLayerSwitch,
      availableBaseLayers: Object.keys(availableBaseLayers || {}).filter(k => availableBaseLayers[k]),
      availableBaseLayersCustom,
    });

    if (effectiveDefaultValue.features.length > 0) {
      setTimeout(() => {
        this.skipNextUpdate = true;
        this.mapService?.loadDrawnItems(effectiveDefaultValue.features);
      }, 100);
    }

    this.initialized = true;
  }

  getDrawOptions(markerType) {
    const defaults = {
      rectangle: null,
      circle: false,
      polyline: false,
      polygon: false,
      circlemarker: false,
      marker: false,
    };

    try {
      Object.entries(markerType || {}).forEach(([key, value]) => {
        defaults[key] = value;
      });

      if (markerType?.rectangle) {
        defaults.rectangle = { showArea: false };
      }
    } catch (error) {
      console.error('Error setting marker types:', error);
    }

    return defaults;
  }

  serializeValue(value) {
    try {
      return JSON.stringify({
        features: value.features?.map(feature => {
          const result: any = { type: feature.type };
          if (feature.coordinates) {
            result.coordinates = ['marker', 'circle'].includes(feature.type)
              ? `${feature.coordinates.lat},${feature.coordinates.lng}`
              : JSON.stringify(feature.coordinates).replace(/[{}"]+/g, '');
          }
          if (feature.bounds) {
            const b = feature.bounds;
            result.bounds = `${b._southWest.lat},${b._southWest.lng},${b._northEast.lat},${b._northEast.lng}`;
          }
          if (feature.radius) result.radius = feature.radius;
          return result;
        }) || [],
        selectedBaseLayer: value.selectedBaseLayer || DEFAULT_BASE_LAYER,
      });
    } catch (error) {
      console.error('Error serializing value:', error);
      return '';
    }
  }

  saveDrawnItems(drawnItems: L.Layer[]) {
    if (this.updatingFromMapService) return;

    const features = drawnItems.map((layer: any) => {
      if (layer instanceof L.Marker) return { type: 'marker', coordinates: layer.getLatLng() };
      if (layer instanceof L.Rectangle) return { type: 'rectangle', bounds: layer.getBounds() };
      if (layer instanceof L.Circle) return { type: 'circle', coordinates: layer.getLatLng(), radius: layer.getRadius() };
      if (layer instanceof L.Polygon) return { type: 'polygon', coordinates: layer.getLatLngs() };
      if (layer instanceof L.Polyline) return { type: 'polyline', coordinates: layer.getLatLngs() };
      return null;
    }).filter(Boolean);

    const currentValue = this.getValue() || { features: [], selectedBaseLayer: DEFAULT_BASE_LAYER };
    const newValue = { features, selectedBaseLayer: currentValue.selectedBaseLayer };
    const newValueStr = this.serializeValue(newValue);

    if (this.lastSavedValue === newValueStr) return;

    this.skipNextUpdate = true;
    this.setValue(newValue);
    this.lastSavedValue = newValueStr;
  }

  // Modified to prevent update loops and fix circular reference issues
  setValue(value) {
    if (!value) return;

    if (this.skipNextUpdate) {
      this.skipNextUpdate = false;
      return super.setValue(value);
    }

    const currentValue = this.getValue() || { features: [], selectedBaseLayer: DEFAULT_BASE_LAYER };
    const newValue = {
      features: value.features || [],
      selectedBaseLayer: value.selectedBaseLayer || currentValue.selectedBaseLayer,
    };

    const currentStr = this.serializeValue(currentValue);
    const newStr = this.serializeValue(newValue);

    if (currentStr === newStr) return;

    const result = super.setValue(newValue);
    this.lastSavedValue = newStr;

    if (this.initialized && this.mapService) {
      this.updatingFromMapService = true;
      this.mapService.loadDrawnItems(newValue.features);
      this.updatingFromMapService = false;
    }

    return result;
  }

  saveBaseLayer(layerName) {
    const currentValue = this.getValue() || { features: [], selectedBaseLayer: DEFAULT_BASE_LAYER };
    const newValue = { ...currentValue, selectedBaseLayer: layerName };
    this.setValue(newValue);
  }
}
