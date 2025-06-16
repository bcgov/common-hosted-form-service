import { Components } from 'formiojs';
import MapService from './services/MapService';
import baseEditForm from './Component.form';
import * as L from 'leaflet';
import {
  DEFAULT_AVAILABLE_BASELAYERS,
  DEFAULT_BASE_LAYER,
  MAP_INIT_DELAY,
  MAX_INIT_ATTEMPTS,
  DEFAULT_CENTER,
  DEFAULT_CONTAINER_HEIGHT,
  tabComponentKeys,
} from './Common/MapConstants';

const FieldComponent = (Components as any).components.field;

export default class Component extends (FieldComponent as any) {
  static schema(...extend) {
    return FieldComponent.schema({
      type: 'map',
      label: 'Map',
      key: 'map',
      input: true,
      defaultValue: { features: [], selectedBaseLayer: DEFAULT_BASE_LAYER },
      allowBaseLayerSwitch: false,
      availableBaseLayers: DEFAULT_AVAILABLE_BASELAYERS,
      availableBaseLayersCustom: [],
      recenterButton: true, // Default to true for recenter button
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
  maxInitializationAttempts = MAX_INIT_ATTEMPTS;
  updatingFromMapService = false;
  skipNextUpdate = false;
  lastSavedValue: string | null = null;

  constructor(component, options, data) {
    super(component, options, data);
    this.componentID = super.elementInfo().component.id;
  }

  render() {
    return super.render(
      `<div id="map-${this.componentID}" style="height:${DEFAULT_CONTAINER_HEIGHT}; z-index:1;"></div>`
    );
  }

  attach(element) {
    const superAttach = super.attach(element);
    this.mapInitializationAttempts = 0;
    this.cleanupMap();
    setTimeout(() => this.tryLoadMap(), MAP_INIT_DELAY);
    this.on('change', (event) => {
      if (
        event.changed &&
        tabComponentKeys.includes(event.changed.component.key)
      ) {
        setTimeout(() => {
          if (this.mapService && this.mapService.map) {
            this.mapService.map.invalidateSize();
          }
        }, MAP_INIT_DELAY);
      }
    });
    return superAttach;
  }

  async tryLoadMap() {
    try {
      await this.loadMap();
    } catch (error) {
      console.warn('Error loading Map', error);
      const mapContainer = document.getElementById(`map-${this.componentID}`);
      if (mapContainer) {
        mapContainer.innerHTML =
          '<div class="alert alert-danger">Error loading map. Please check console for details.</div>';
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

  async loadMap() {
    this.mapContainer = document.getElementById(`map-${this.componentID}`);

    if (!this.mapContainer) {
      if (this.mapInitializationAttempts++ < this.maxInitializationAttempts) {
        setTimeout(() => this.loadMap(), 200);
      }
      return;
    }

    // Check if container already has a map instance
    if (this.mapContainer._leaflet_id) {
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
      recenterButton, // Extract recenter button setting
    } = this.component;

    const drawOptions = this.getDrawOptions(markerType);
    const viewMode = this.options.readOnly;

    const initialCenter = center?.features?.[0]?.coordinates ?? DEFAULT_CENTER;
    const selectedBaseLayer =
      this.dataValue?.selectedBaseLayer ?? DEFAULT_BASE_LAYER;

    let effectiveDefaultValue: { features: any; selectedBaseLayer?: any };

    if (this.dataValue?.features?.length) {
      effectiveDefaultValue = this.dataValue;
    } else if (defaultValue?.features?.length) {
      effectiveDefaultValue = defaultValue;
    } else {
      effectiveDefaultValue = {
        features: [],
        selectedBaseLayer: selectedBaseLayer ?? DEFAULT_BASE_LAYER,
      };
    }

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
      availableBaseLayers: Object.keys(availableBaseLayers ?? {}).filter(
        (k) => availableBaseLayers[k]
      ),
      availableBaseLayersCustom,
      recenterButton, // Pass recenter button setting to MapService
    });

    // Now explicitly call async initialize outside constructor
    await this.mapService.init();

    if (effectiveDefaultValue.features.length > 0) {
      setTimeout(() => {
        this.skipNextUpdate = true;
        this.mapService?.loadDrawnItems(effectiveDefaultValue.features);
      }, MAP_INIT_DELAY);
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
      Object.entries(markerType ?? {}).forEach(([key, value]) => {
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

  serializeValue(value: any): string {
    try {
      const serializedFeatures =
        value.features?.map((feature: any) => {
          const { type, coordinates, bounds, radius } = feature;
          const result: any = { type };

          if (coordinates) {
            result.coordinates = ['marker', 'circle'].includes(type)
              ? `${coordinates.lat},${coordinates.lng}`
              : JSON.stringify(coordinates).replace(/[{}"]+/g, '');
          }

          if (bounds?._southWest && bounds?._northEast) {
            const sw = bounds._southWest;
            const ne = bounds._northEast;
            result.bounds = `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`;
          }

          if (radius !== undefined) {
            result.radius = radius;
          }

          return result;
        }) ?? [];

      return JSON.stringify({
        features: serializedFeatures,
        selectedBaseLayer: value.selectedBaseLayer ?? DEFAULT_BASE_LAYER,
      });
    } catch (error) {
      console.error('Error serializing value:', error);
      return '';
    }
  }

  saveDrawnItems(drawnItems: L.Layer[]) {
    if (this.updatingFromMapService) return;

    const features = drawnItems
      .map((layer: any) => {
        if (layer instanceof L.Marker)
          return { type: 'marker', coordinates: layer.getLatLng() };
        if (layer instanceof L.Rectangle)
          return { type: 'rectangle', bounds: layer.getBounds() };
        if (layer instanceof L.Circle)
          return {
            type: 'circle',
            coordinates: layer.getLatLng(),
            radius: layer.getRadius(),
          };
        if (layer instanceof L.Polygon)
          return { type: 'polygon', coordinates: layer.getLatLngs() };
        if (layer instanceof L.Polyline)
          return { type: 'polyline', coordinates: layer.getLatLngs() };
        return null;
      })
      .filter(Boolean);

    const currentValue = this.getValue() ?? {
      features: [],
      selectedBaseLayer: DEFAULT_BASE_LAYER,
    };
    const newValue = {
      features,
      selectedBaseLayer: currentValue.selectedBaseLayer,
    };
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

    const currentValue = this.getValue() ?? {
      features: [],
      selectedBaseLayer: DEFAULT_BASE_LAYER,
    };
    const newValue = {
      features: value.features ?? [],
      selectedBaseLayer:
        value.selectedBaseLayer ?? currentValue.selectedBaseLayer,
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
    const currentValue = this.getValue() ?? {
      features: [],
      selectedBaseLayer: DEFAULT_BASE_LAYER,
    };
    const newValue = { ...currentValue, selectedBaseLayer: layerName };
    this.setValue(newValue);
  }
}
