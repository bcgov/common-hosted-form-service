import * as L from 'leaflet';
import 'leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw-src.css';

const DEFAULT_MAP_LAYER_URL =
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DEFAULT_MAP_ZOOM = 13;
const DECIMALS_LATLNG = 5; // the number of decimals of latitude and longitude to be displayed in the marker popup

interface MapServiceOptions {
  mapContainer: HTMLElement;
  center: [number, number]; // Ensure center is a tuple with exactly two elements
  drawOptions: any;
  form: HTMLCollectionOf<Element>;
  numPoints: number;
  defaultZoom?: number;
  onDrawnItemsChange: (items: any) => void; // Support both single and multiple items
}

class MapService {
  options: MapServiceOptions;
  map: L.Map;
  drawnItems: L.FeatureGroup;

  constructor(options: MapServiceOptions) {
    this.options = options;
    if (options.mapContainer) {
      const { map, drawnItems } = this.initializeMap(options);
      this.map = map;
      this.drawnItems = drawnItems;
      map.invalidateSize();

      // Event listener for drawn objects
      map.on('draw:created', (e: any) => {
        let layer = e.layer;
        if (
          drawnItems.getLayers().length === options.numPoints &&
          e?.type === 'marker'
        ) {
          L.popup()
            .setLatLng(layer._latlng)
            .setContent('<p>Only one marker for submission</p>')
            .openOn(map);
        } else {
          drawnItems.addLayer(layer);
        }
        layer
          .bindPopup(
            `<p>(${layer._latlng.lat.toFixed(
              DECIMALS_LATLNG
            )},${layer._latlng.lng.toFixed(DECIMALS_LATLNG)})</p>`
          )
          .openPopup();
        options.onDrawnItemsChange(drawnItems.getLayers());
      });
    }
  }

  initializeMap(options: MapServiceOptions) {
    let { mapContainer, center, drawOptions, form, defaultZoom } = options;
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
    let drawControl = new L.Control.Draw({
      draw: drawOptions,
      edit: {
        featureGroup: drawnItems,
      },
    });

    if (form && form[0]?.classList.contains('formbuilder')) {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
    }

    // Attach Controls to map
    map.addControl(drawControl);
    return { map, drawnItems };
  }

  loadDrawnItems(items: any) {
    const { drawnItems } = this;
    drawnItems.clearLayers();

    // Check if items is an array
    if (!Array.isArray(items)) {
      items = [items];
    }

    items.forEach((item) => {
      let layer;
      if (item.type === 'marker') {
        layer = L.marker(item.latlng);
      }
      // Handle other types (e.g., rectangles) here if needed

      if (layer) {
        drawnItems.addLayer(layer);
        layer
          .bindPopup(
            `<p>(${item.latlng.lat.toFixed(
              DECIMALS_LATLNG
            )},${item.latlng.lng.toFixed(DECIMALS_LATLNG)})</p>`
          )
          .openPopup();
      }
    });
  }
}

export default MapService;
