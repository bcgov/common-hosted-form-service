import * as L from 'leaflet';
import 'leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw-src.css';

const DEFAULT_MAP_LAYER_URL =
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DEFAULT_MAP_ZOOM = 5;
const DECIMALS_LATLNG = 5; // the number of decimals of latitude and longitude to be displayed in the marker popup
const COMPONENT_EDIT_CLASS = 'component-edit-tabs';
const CUSTOM_MARKER_PATH = 'https://unpkg.com/leaflet@1.9.4/dist/images/';

L.Icon.Default.imagePath = CUSTOM_MARKER_PATH;

interface MapServiceOptions {
  mapContainer: HTMLElement;
  center: [number, number]; // Ensure center is a tuple with exactly two elements
  drawOptions: any;
  form: HTMLCollectionOf<Element>;
  numPoints: number;
  defaultZoom?: number;
  readOnlyMap?: boolean;
  onDrawnItemsChange: (items: any) => void; // Support both single and multiple items
  viewMode?: boolean;
}

class MapService {
  options;
  map;
  drawnItems;

  constructor(options) {
    this.options = options;

    if (options.mapContainer) {
      const { map, drawnItems } = this.initializeMap(options);

      this.map = map;
      this.drawnItems = drawnItems;

      map.invalidateSize();
      // Triggering a resize event after map initialization
      setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
      // Event listener for drawn objects
      map.on('draw:created', (e) => {
        let layer = e.layer;
        if (drawnItems.getLayers().length === options.numPoints) {
          L.popup()
            .setLatLng(layer.getLatLng())
            .setContent('<p>Only one marker for submission</p>')
            .openOn(map);
        } else {
          drawnItems.addLayer(layer);
        }
        this.bindPopupToLayer(layer);
        options.onDrawnItemsChange(drawnItems.getLayers());
      });
      map.on(L.Draw.Event.DELETED, (e) => {
        options.onDrawnItemsChange(drawnItems.getLayers());
      });
      map.on(L.Draw.Event.EDITSTOP, (e) => {
        options.onDrawnItemsChange(drawnItems.getLayers());
      });

      map.on('resize', () => {
        map.invalidateSize();
      });
    }
  }

  initializeMap(options: MapServiceOptions) {
    let {
      mapContainer,
      center,
      drawOptions,
      form,
      defaultZoom,
      readOnlyMap,
      viewMode,
    } = options;

    if (drawOptions.rectangle) {
      drawOptions.rectangle.showArea = false;
    }
    const map = L.map(mapContainer).setView(
      center,
      defaultZoom || DEFAULT_MAP_ZOOM
    );
    L.tileLayer(DEFAULT_MAP_LAYER_URL, {
      attribution: DEFAULT_LAYER_ATTRIBUTION,
    }).addTo(map);

    // Initialize Draw Layer
    let drawnItems = new L.FeatureGroup();

    map.addLayer(drawnItems);

    // Add Drawing Controllers
    if (!readOnlyMap) {
      if (!viewMode) {
        let drawControl = new L.Control.Draw({
          draw: drawOptions,
          edit: {
            featureGroup: drawnItems,
          },
        });
        map.addControl(drawControl);
      }
    }

    // Checking to see if the map should be interactable
    const componentEditNode =
      document.getElementsByClassName(COMPONENT_EDIT_CLASS);
    if (form) {
      if (form[0]?.classList.contains('formbuilder')) {
        map.invalidateSize();
        map.dragging.disable();
        map.scrollWheelZoom.disable();
        if (this.hasChildNode(componentEditNode[0], mapContainer)) {
          map.dragging.enable();
          map.scrollWheelZoom.enable();
        }
      }
    }
    return { map, drawnItems };
  }

  bindPopupToLayer(layer) {
    if (layer instanceof L.Marker) {
      layer
        .bindPopup(
          `<p>(${layer.getLatLng().lat.toFixed(DECIMALS_LATLNG)},${layer
            .getLatLng()
            .lng.toFixed(DECIMALS_LATLNG)})</p>`
        )
        .openPopup();
    } else if (layer instanceof L.Circle) {
      layer
        .bindPopup(
          `<p>(${layer.getLatLng().lat.toFixed(DECIMALS_LATLNG)},${layer
            .getLatLng()
            .lng.toFixed(DECIMALS_LATLNG)})</p>`
        )
        .openPopup();
    } else if (layer instanceof L.Rectangle || layer instanceof L.Polygon) {
      const bounds = layer.getBounds();
      const center = bounds.getCenter();
      layer
        .bindPopup(
          `<p>(${center.lat.toFixed(DECIMALS_LATLNG)},${center.lng.toFixed(
            DECIMALS_LATLNG
          )})</p>`
        )
        .openPopup();
    }
  }

  loadDrawnItems(items) {
    const { drawnItems } = this;
    if (!drawnItems) {
      console.error('drawnItems is undefined');
      return;
    }
    drawnItems.clearLayers();
    if (!Array.isArray(items)) {
      items = [items];
    }
    items.forEach((item) => {
      let layer;
      if (item.type === 'marker') {
        layer = L.marker(item.coordinates);
      } else if (item.type === 'rectangle') {
        layer = L.rectangle(item.bounds);
      } else if (item.type === 'circle') {
        layer = L.circle(item.coordinates, { radius: item.radius });
      } else if (item.type === 'polygon') {
        layer = L.polygon(item.coordinates);
      } else if (item.type === 'polyline') {
        layer = L.polyline(item.coordinates);
      }
      if (layer) {
        drawnItems.addLayer(layer);
        this.bindPopupToLayer(layer);
      }
    });
  }

  hasChildNode(parent, targetNode) {
    if (parent === targetNode) {
      return true;
    }
    for (let i = 0; i < parent?.childNodes?.length; i++) {
      if (this.hasChildNode(parent.childNodes[i], targetNode)) {
        return true;
      }
    }
    return false;
  }
}
export default MapService;
