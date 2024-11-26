import * as L from 'leaflet';
import * as GeoSearch from 'leaflet-geosearch';
import { BCGeocoderProvider } from '../services/BCGeocoderProvider';
import 'leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw-src.css';
import 'leaflet-geosearch/dist/geosearch.css';

const DEFAULT_MAP_LAYER_URL =
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DEFAULT_MAP_ZOOM = 5;
const DECIMALS_LATLNG = 5; // the number of decimals of latitude and longitude to be displayed in the marker popup
const COMPONENT_EDIT_CLASS = 'component-edit-tabs';
const READ_ONLY_CLASS = 'formio-read-only';
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
  myLocation?: boolean;
  bcGeocoder: boolean;
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

      // this.map = map;
      this.drawnItems = drawnItems;

      map.invalidateSize();
      // Triggering a resize event after map initialization
      setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
      // Event listener for drawn objects
      map.on('draw:created', (e) => {
        const layer = e.layer;
        if (drawnItems.getLayers().length === options.numPoints) {
          map.closePopup();
          L.popup()
            .setLatLng(map.getCenter())
            .setContent(
              `<p>Only ${options.numPoints} features per submission</p>`
            )
            .addTo(map);
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
    const {
      mapContainer,
      center,
      drawOptions,
      form,
      defaultZoom,
      readOnlyMap,
      viewMode,
      myLocation,
      bcGeocoder,
    } = options;

    if (drawOptions.rectangle) {
      drawOptions.rectangle.showArea = false;
    }
    // Check to see if there is the formio read only class in the current page, and set notEditable to true if the map is inside a read-only page

    // if the user chooses it to be read-only, and the
    const map = L.map(mapContainer, {
      zoomAnimation: viewMode,
    }).setView(center, defaultZoom || DEFAULT_MAP_ZOOM);
    L.tileLayer(DEFAULT_MAP_LAYER_URL, {
      attribution: DEFAULT_LAYER_ATTRIBUTION,
    }).addTo(map);

    // Initialize Draw Layer
    const drawnItems = new L.FeatureGroup();

    map.addLayer(drawnItems);

    if (myLocation) {
      const myLocationButton = L.Control.extend({
        options: {
          position: 'bottomright',
        },
        onAdd(map) {
          const container = L.DomUtil.create(
            'div',
            'leaflet-bar leaflet-control'
          );
          const button = L.DomUtil.create(
            'a',
            'leaflet-control-button',
            container
          );
          button.innerHTML = '<i class="fa fa-location-arrow"></i>';
          L.DomEvent.disableClickPropagation(button);
          L.DomEvent.on(button, 'click', () => {
            if ('geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition((position) => {
                map.setView(
                  [position.coords.latitude, position.coords.longitude],
                  14
                );
                L.popup()
                  .setLatLng([
                    position.coords.latitude,
                    position.coords.longitude,
                  ])
                  .setContent(
                    `(${position.coords.latitude}, ${position.coords.longitude})`
                  )
                  .openOn(map);
              });
            }
          });
          container.title = 'Click to center the map on your location';
          return container;
        },
      });
      const myLocationControl = new myLocationButton();
      myLocationControl.addTo(map);
    }

    if (bcGeocoder) {
      const geocoderControl = new (GeoSearch.GeoSearchControl as any)({
        provider: new BCGeocoderProvider(),
        style: 'bar',
        position: 'bottomleft',
        showMarker: false,
      });
      map.addControl(geocoderControl);
      map.on('geosearch/showlocation', (e) => {
        L.popup()
          .setLatLng([(e as any).location.y, (e as any).location.x])
          .setContent(`${(e as any).location.label}`)
          .openOn(map);
      });
    }

    // Add Drawing Controllers
    if (!readOnlyMap) {
      if (!viewMode) {
        const drawControl = new L.Control.Draw({
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
