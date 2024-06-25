import { Components } from 'formiojs';
const BaseComponent = (Components as any).components.base;
import MapService from './services/MapService';
import baseEditForm from './Component.form';
import * as L from 'leaflet';

const CENTER: [number, number] = [48.41939025932759, -123.37029576301576]; // Ensure CENTER is a tuple with exactly two elements

export default class Component extends (BaseComponent as any) {
  static schema(...extend) {
    return BaseComponent.schema({
      type: 'map',
      label: 'Map',
      key: 'map',
      input: true,
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
    console.log('Rendering component');
    return super.render(
      `<div id="map-${this.componentID}" style="height:400px; z-index:1;"></div>`
    );
  }

  attach(element) {
    console.log('Attaching component to element');
    const superAttach = super.attach(element);
    this.loadMap();
    return superAttach;
  }

  loadMap() {
    console.log('Loading map');
    const mapContainer = document.getElementById(`map-${this.componentID}`);
    const form = document.getElementsByClassName('formio');
    let drawOptions = {
      marker: false,
      circlemarker: false,
      polygon: false,
      polyline: false,
      circle: false,
      rectangle: null,
    };

    // Set drawing options based on markerType
    if (this.component.markerType === 'rectangle') {
      drawOptions.rectangle = { showArea: false }; // fixes a bug in Leaflet.Draw
    } else {
      drawOptions.rectangle = false;
      drawOptions[this.component.markerType] = true; // set marker type from user choice
    }

    const { numPoints, defaultZoom } = this.component;
    this.mapService = new MapService({
      mapContainer,
      drawOptions,
      center: CENTER,
      form,
      numPoints,
      defaultZoom,
      onDrawnItemsChange: this.saveDrawnItems.bind(this),
    });

    console.log('Current data value:', this.dataValue);
    console.log('GetValue result:', this.getValue());

    // Load existing data if available
    if (this.dataValue) {
      this.mapService.loadDrawnItems(JSON.parse(this.dataValue));
    }
  }

  saveDrawnItems(drawnItems: L.Layer[]) {
    console.log('Saving drawn items:', drawnItems);
    const value = drawnItems.map((layer: any) => {
      console.log('Processing layer:', layer);
      if (layer instanceof L.Marker) {
        return {
          type: 'marker',
          latlng: layer.getLatLng(),
        };
      } else if (layer instanceof L.Rectangle) {
        return {
          type: 'rectangle',
          bounds: layer.getBounds(),
        };
      } else if (layer instanceof L.Circle) {
        return {
          type: 'circle',
          latlng: layer.getLatLng(),
          radius: layer.getRadius(),
        };
      } else if (layer instanceof L.Polygon) {
        return {
          type: 'polygon',
          latlngs: layer.getLatLngs(),
        };
      } else if (layer instanceof L.Polyline) {
        return {
          type: 'polyline',
          latlngs: layer.getLatLngs(),
        };
      }
    });

    console.log('Converted value:', value);

    // Convert to JSON string
    const jsonValue =
      this.component.numPoints === 1
        ? JSON.stringify(value[0])
        : JSON.stringify(value);
    console.log('JSON value to set:', jsonValue);
    this.setValue(jsonValue);
  }

  setValue(value) {
    console.log('Setting value:', value);
    super.setValue(value);

    // Additional logic to render the saved data on the map if necessary
    if (this.mapService && value) {
      try {
        const parsedValue = JSON.parse(value);
        this.mapService.loadDrawnItems(parsedValue);
      } catch (error) {
        console.error('Failed to parse value:', error);
      }
    }
  }

  getValue() {
    console.log('Getting value:', this.dataValue);
    return this.dataValue;
  }
}
