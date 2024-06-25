import { Components } from 'formiojs';
const FieldComponent = (Components as any).components.field;
import MapService from './services/MapService';
import baseEditForm from './Component.form';
import * as L from 'leaflet';

const CENTER: [number, number] = [48.41939025932759, -123.37029576301576]; // Ensure CENTER is a tuple with exactly two elements

export default class Component extends (FieldComponent as any) {
  static schema(...extend) {
    return FieldComponent.schema({
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
    return super.render(
      `<div id="map-${this.componentID}" style="height:400px; z-index:1;"></div>`
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
    let drawOptions = {
      marker: false,
      circlemarker: false,
      polygon: false,
      polyline: false,
      circle: false,
      rectangle: null,
    };
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

    // Load existing data if available
    if (this.dataValue) {
      this.mapService.loadDrawnItems(JSON.parse(this.dataValue));
    }
  }

  saveDrawnItems(drawnItems: L.Layer[]) {
    const value = drawnItems.map((layer: any) => {
      if (layer instanceof L.Marker) {
        return {
          type: 'marker',
          latlng: layer.getLatLng(),
        };
      }
      // Handle other types (e.g., rectangles) here if needed
    });

    // Convert to JSON string
    const jsonValue =
      this.component.numPoints === 1
        ? JSON.stringify(value[0])
        : JSON.stringify(value);
    this.setValue(jsonValue);
  }

  setValue(value) {
    super.setValue(value);
    // Additional logic to render the saved data on the map if necessary
    if (this.mapService) {
      this.mapService.loadDrawnItems(JSON.parse(value));
    }
  }

  getValue() {
    return this.dataValue;
  }
}
