import * as L from 'leaflet';
import * as GeoSearch from 'leaflet-geosearch';
import { BCGeocoderProvider } from '../services/BCGeocoderProvider';
import {
  BASE_LAYER_URLS,
  BASE_LAYER_ATTRIBUTIONS,
} from '../Common/MapConstants';
import 'leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw-src.css';
import 'leaflet-geosearch/dist/geosearch.css';
import 'leaflet.vectorgrid';

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

  async initialize(options) {
    const { map, drawnItems } = await this.initializeMap(options);
    this.map = map;
    this.drawnItems = drawnItems;

    map.invalidateSize();
    setTimeout(() => window.dispatchEvent(new Event('resize')), 0);

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

    map.on(L.Draw.Event.DELETED, () =>
      options.onDrawnItemsChange(drawnItems.getLayers())
    );
    map.on(L.Draw.Event.EDITSTOP, () =>
      options.onDrawnItemsChange(drawnItems.getLayers())
    );
    map.on('resize', () => map.invalidateSize());
  }
  constructor(options) {
    this.options = options;

    if (options.mapContainer) {
      this.initialize(options);
    }
  }

  async initializeMap(options: MapServiceOptions) {
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

    // Initialize the map
    const map = L.map(mapContainer, {
      zoomAnimation: viewMode,
    }).setView(center, defaultZoom || DEFAULT_MAP_ZOOM);

    // Define base layers
    const baseLayers = {
      OpenStreetMap: L.tileLayer(BASE_LAYER_URLS.OpenStreetMap, {
        attribution: BASE_LAYER_ATTRIBUTIONS.OpenStreetMap,
      }),
      Satellite: L.tileLayer(BASE_LAYER_URLS.Satellite, {
        attribution: BASE_LAYER_ATTRIBUTIONS.Satellite,
      }),
      Topographic: L.tileLayer(BASE_LAYER_URLS.Topographic, {
        attribution: BASE_LAYER_ATTRIBUTIONS.Topographic,
      }),
      ESRIWorldImagery: L.tileLayer(BASE_LAYER_URLS.ESRIWorldImagery, {
        attribution: BASE_LAYER_ATTRIBUTIONS.ESRIWorldImagery,
      }),
      // WMS Layer (for example, OpenStreetMap WMS)
      OSM_WMS: L.tileLayer.wms('https://ows.terrestris.de/osm/service?', {
        layers: 'OSM-WMS',
        format: 'image/png',
        transparent: true,
        attribution:
          '&copy; <a href="https://www.terrestris.de/en">Terrestris</a> contributors',
      }),
      BC_BASEMAP: L.vectorGrid.protobuf(
        `${BASE_LAYER_URLS.BC_BASEMAP}/tile/{z}/{y}/{x}.pbf`,
        {
          vectorTileLayerStyles: {
            default: {
              fillColor: '#ffffff',
              color: '#000000',
              weight: 1,
            },
          },
          attribution: BASE_LAYER_ATTRIBUTIONS.BC_BASEMAP,
        }
      ),
      HILL_SHADE: L.vectorGrid.protobuf(
        `${BASE_LAYER_URLS.HILL_SHADE}/tile/{z}/{y}/{x}.pbf`,
        {
          vectorTileLayerStyles: {
            // Style for different layers in the tile
            default: {
              weight: 1,
              color: '#3388ff',
              fillColor: '#66c2a5',
              fillOpacity: 0.4,
            },
            water: {
              weight: 0,
              fillColor: '#aadaff',
              fillOpacity: 0.6,
            },
            land: {
              weight: 0,
              fillColor: '#f0e7c0',
              fillOpacity: 0.8,
            },
            'POLITICAL/Placeholders/TIR BC FN Reserves': {
              weight: 2,
              color: '#C500FF',
              fillOpacity: 0.5,
            },
            'POLITICAL/Placeholders/BC Treaty Lands': {
              weight: 2,
              color: '#C500FF',
              fillOpacity: 0.5,
            },
          },
          attribution: BASE_LAYER_ATTRIBUTIONS.BC_BASEMAP,
        }
      ),
    };

    // Add default base layer to the map
    baseLayers.OpenStreetMap.addTo(map);
    // Load and add vector tile layer from external server
    try {
      const response = await fetch(BASE_LAYER_URLS.STYLE_JSON_URL);
      const styleJson = await response.json();
      console.log('styleJson', styleJson, baseLayers);

      // Dynamically add sources and layers
      const sources = styleJson.sources;
      const layers = styleJson.layers;

      // Explicitly type the vectorTileLayers object as Record<string, L.VectorGrid>
      const vectorTileLayers: Record<string, L.VectorGrid> = {}; // This will allow only L.VectorGrid instances

      // Loop through sources and layers
      Object.keys(sources).forEach((sourceKey) => {
        const source = sources[sourceKey];
        const vectorTileLayer = L.vectorGrid.protobuf(source.tiles[0], {
          attribution: source.attribution,
          vectorTileLayerStyles: this.createLayerStyles(layers),
          bounds: source.bounds,
          minZoom: source.minzoom,
          maxZoom: source.maxzoom,
        });

        // Add the layer to the map layers object
        vectorTileLayers[sourceKey] = vectorTileLayer;
      });

      // Add vector tile layers control
      L.control.layers({}, vectorTileLayers).addTo(map);

      // Add the first source by default
      // Since vectorTileLayers is now typed, TypeScript will know that addTo is valid
      vectorTileLayers[Object.keys(vectorTileLayers)[0]].addTo(map);
    } catch (error) {
      console.error('Error loading vector tile style JSON:', error);
    }

    // Add Layer Control to the map
    L.control.layers(baseLayers).addTo(map);

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

  // Helper function to create styles based on the JSON layers
  createLayerStyles(layers) {
    const styles = {};
    layers.forEach((layer) => {
      styles[layer.id] = {
        // You can customize the style generation as per your needs
        'text-color': layer.paint['text-color'],
        'text-font': layer.layout['text-font'],
        'text-size': layer.layout['text-size'],
        'text-field': layer.layout['text-field'],
        visibility: layer.layout.visibility,
      };
    });
    return styles;
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
