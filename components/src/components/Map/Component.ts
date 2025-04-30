import { Components } from 'formiojs';
const FieldComponent = (Components as any).components.field;
import MapService from './services/MapService';
import baseEditForm from './Component.form';
import * as L from 'leaflet';

const DEFAULT_CENTER: [number, number] = [
  53.96717190097409, -123.98320425388914,
]; // Ensure CENTER is a tuple with exactly two elements
const DEFAULT_CONTAINER_HEIGHT = '400px';

export default class Component extends (FieldComponent as any) {
  static schema(...extend) {
    return FieldComponent.schema({
      type: 'map',
      label: 'Map',
      key: 'map',
      input: true,
      defaultValue: { features: [], selectedBaseLayer: 'OpenStreetMap' },
      allowBaseLayerSwitch: false,
      availableBaseLayers: {
        OpenStreetMap: true,
        Light: true,
        Dark: true,
        Satellite: true,
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
  mapService: MapService;

  constructor(component, options, data) {
    super(component, options, data);
    this.componentID = super.elementInfo().component.id;
  }

  render() {
    return super.render(
      `<div id="map-${this.componentID}" style="height:${DEFAULT_CONTAINER_HEIGHT}; z-index:1;"> </div>`
    );
  }

  attach(element) {
    const superAttach = super.attach(element);
    this.loadMap();
    return superAttach;
  }

  loadMap() {
    const mapContainer = document.getElementById(`map-${this.componentID}`);
    const form = document.getElementsByClassName('formio');

    const drawOptions = {
      rectangle: null,
      circle: false,
      polyline: false,
      polygon: false,
      circlemarker: false,
      marker: false,
    };
    // marker: false,
    // circlemarker: false,
    // polygon: false,
    // polyline: false,
    // circle: false,
    // rectangle: null,
    // set marker type from user choice
    if (this.component.markerType) {
      for (const [key, value] of Object.entries(this.component.markerType)) {
        drawOptions[key] = value;
      }
    }

    // Set drawing options based on markerType
    if (this.component?.markerType?.rectangle) {
      drawOptions.rectangle = { showArea: false }; // fixes a bug in Leaflet.Draw
    } else {
      drawOptions.rectangle = false;
    }

    const {
      numPoints,
      defaultZoom,
      allowSubmissions,
      center,
      defaultValue,
      myLocation,
      bcGeocoder,
      allowBaseLayerSwitch,
      availableBaseLayers,
      availableBaseLayersCustom,
    } = this.component;

    const { readOnly: viewMode } = this.options;

    let initialCenter;
    if (center?.features?.[0]?.coordinates) {
      initialCenter = center.features[0].coordinates;
    } else {
      initialCenter = DEFAULT_CENTER;
    }
    const selectedBaseLayer =
      this.dataValue?.selectedBaseLayer ?? 'OpenStreetMap';
    this.mapService = new MapService({
      mapContainer,
      drawOptions,
      center: initialCenter,
      form,
      numPoints,
      defaultZoom,
      readOnlyMap: !allowSubmissions, // if allow submissions, read only is false
      defaultValue,
      onDrawnItemsChange: this.saveDrawnItems.bind(this),
      viewMode,
      myLocation,
      bcGeocoder,
      selectedBaseLayer, // Load saved baselayer
      onBaseLayerChange: (layerName) => this.saveBaseLayer(layerName),
      allowBaseLayerSwitch,
      availableBaseLayers: Object.keys(availableBaseLayers || {}).filter(
        (k) => availableBaseLayers[k]
      ),
      availableBaseLayersCustom,
    });

    // Load existing data if available
    if (this.dataValue && this.dataValue.features) {
      try {
        this.mapService.loadDrawnItems(this.dataValue.features);
      } catch (error) {
        console.error('Failed to parse dataValue:', error);
      }
    }
  }

  saveDrawnItems(drawnItems: L.Layer[]) {
    const features = drawnItems.map((layer: any) => {
      if (layer instanceof L.Marker) {
        return {
          type: 'marker',
          coordinates: layer.getLatLng(),
        };
      } else if (layer instanceof L.Rectangle) {
        return {
          type: 'rectangle',
          bounds: layer.getBounds(),
        };
      } else if (layer instanceof L.Circle) {
        return {
          type: 'circle',
          coordinates: layer.getLatLng(),
          radius: layer.getRadius(),
        };
      } else if (layer instanceof L.Polygon) {
        return {
          type: 'polygon',
          coordinates: layer.getLatLngs(),
        };
      } else if (layer instanceof L.Polyline) {
        return {
          type: 'polyline',
          coordinates: layer.getLatLngs(),
        };
      }
    });
    // Store features and currently active base layer
    this.setValue({
      features,
      selectedBaseLayer: this.mapService?.currentBaseLayer || 'OpenStreetMap',
    });
  }

  setValue(value) {
    const currentValue = this.getValue();
    const isSame =
      JSON.stringify(currentValue?.features) ===
        JSON.stringify(value?.features) &&
      currentValue?.selectedBaseLayer === value?.selectedBaseLayer;

    if (isSame) return;

    super.setValue(value);

    if (this.mapService && value) {
      try {
        if (value.features) {
          this.mapService.loadDrawnItems(value.features);
        }
        const baseLayer = value.selectedBaseLayer ?? 'OpenStreetMap';
        this.mapService.setBaseLayer(baseLayer);
      } catch (error) {
        console.error('Failed to apply map value:', error);
      }
    }
  }

  getValue() {
    return this.dataValue;
  }
  isEmpty(value) {
    if (!this.component.allowSubmissions) return false;
    // If the map is supposed to be read-only, just override the required flag

    // this is to ensure if the map designer doesnt set the number of features
    // to be exactly equal to the number of default features the form would not submit

    return (
      value?.features?.length === 0 ||
      value?.features?.length === this.defaultValue?.features?.length
    );
  }
  saveBaseLayer(layerName: string) {
    const newValue = {
      ...this.getValue(),
      selectedBaseLayer: layerName,
    };

    if (this.getValue()?.selectedBaseLayer !== layerName) {
      this.setValue(newValue);
    }
  }
}
