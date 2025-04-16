import * as L from 'leaflet';
import * as GeoSearch from 'leaflet-geosearch';
import { BCGeocoderProvider } from '../services/BCGeocoderProvider';
import {
  BASE_LAYER_URLS,
  BASE_LAYER_ATTRIBUTIONS
} from '../Common/MapConstants';
import 'leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw-src.css';
import 'leaflet-geosearch/dist/geosearch.css';
import 'leaflet.vectorgrid';

const DEFAULT_MAP_ZOOM = 5;
const DECIMALS_LATLNG = 5; // the number of decimals of latitude and longitude to be displayed in the marker popup
const COMPONENT_EDIT_CLASS = 'component-edit-tabs';
const CUSTOM_MARKER_PATH = 'https://unpkg.com/leaflet@1.9.4/dist/images/';

L.Icon.Default.imagePath = CUSTOM_MARKER_PATH;

interface MapServiceOptions {
  mapContainer: HTMLElement;
  center: [number, number]; // Ensure center is a tuple with exactly two elements
  drawOptions: any;
  drawControl:any;
  form: HTMLCollectionOf<Element>;
  numPoints: number;
  defaultZoom?: number;
  readOnlyMap?: boolean;
  onDrawnItemsChange: (items: any) => void; // Support both single and multiple items
  viewMode?: boolean;
  myLocation?: boolean;
  bcGeocoder: boolean;
  required: boolean;
  defaultValue?: any;
  allowBaseLayerSwitch?: boolean;
  selectedBaseLayer?: string;
  onBaseLayerChange?: (layerName: string) => void;
  availableBaseLayers?: string[];
}

class MapService {
  options;
  map;
  drawnItems;
  drawControl;
  defaultFeatures;
  currentBaseLayer: string;
  baseLayers;

  async initialize(options) {
      const { map, drawnItems, drawControl } = await this.initializeMap(options);
      this.map = map;
      this.drawnItems = drawnItems;
      this.drawControl = drawControl; // Store the draw control globally

      if (
        this.options.defaultValue !== null &&
        this.options.defaultValue?.features.length !== 0
      ) {
        this.defaultFeatures = this.arrayToFeatureGroup(
          this.options.defaultValue?.features
          // defaultFeatures are stored in a naive fashion for ease
          // of readability for CHEFS reviewers
        );
      }

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

      map.on(L.Draw.Event.DELETED, (e: any) => {
        e.layers.eachLayer((layer) => {
          const match = this.isDefaultFeature(layer as L.Layer);
          if (match) {
            // re-add the feature/layer to the map
            drawnItems.addLayer(layer);
            L.popup()
              .setLatLng(map.getCenter())
              .setContent('<p>Please do not delete pre-existing features</p>')
              .addTo(map);
          }
        });
        options.onDrawnItemsChange(drawnItems.getLayers());
      });
      map.on(L.Draw.Event.EDITSTOP, (e) => {
        options.onDrawnItemsChange(drawnItems.getLayers());
      });
      map.on('resize', () => {
        map.invalidateSize();
      });
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
      allowBaseLayerSwitch = true,
      availableBaseLayers,
      selectedBaseLayer
    } = options;
    if (drawOptions.rectangle) {
      drawOptions.rectangle.showArea = false;
    }
    // Check to see if there is the formio read only class in the current page, and set notEditable to true if the map is inside a read-only page
    // if the user chooses it to be read-only, and the
    const styleJson = await this.fetchStyleJson(BASE_LAYER_URLS.STYLE_JSON_URL);
    const vectorTileOptions = this.getVectorTileOptions(styleJson||{});
    // Initialize the map
    const map = L.map(mapContainer, {
      zoomAnimation: viewMode,
    }).setView(center, defaultZoom || DEFAULT_MAP_ZOOM);
    // Define base layers
   const allLayers = {
      OpenStreetMap: L.tileLayer(BASE_LAYER_URLS.OpenStreetMap, {
        attribution: BASE_LAYER_ATTRIBUTIONS.OpenStreetMap,
      }),
      Light: L.tileLayer(BASE_LAYER_URLS.Light, {
        attribution: BASE_LAYER_ATTRIBUTIONS.CARTO,
      }),
      Dark: L.tileLayer(BASE_LAYER_URLS.Dark, {
        attribution: BASE_LAYER_ATTRIBUTIONS.CARTO,
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
    };

    this.baseLayers = availableBaseLayers
      ? Object.fromEntries(
        Object.entries(allLayers).filter(([key]) =>
          availableBaseLayers.includes(key)
        )
      )
      : allLayers;

    // Pick the initial base layer
    const selectedLayerKey = this.baseLayers[selectedBaseLayer]
      ? selectedBaseLayer
      : Object.keys(this.baseLayers)[0]; // fallback to first available if default is missing

    const selectedLayer = this.baseLayers[selectedLayerKey];
    selectedLayer.addTo(map);
    // Track the base layer that is initially selected
    this.currentBaseLayer = selectedLayerKey;

    // Only show layer control if allowed and multiple layers exist
    if (allowBaseLayerSwitch && Object.keys(this.baseLayers).length > 1) {
      const layerControl = L.control.layers(this.baseLayers).addTo(map);
      map.on('baselayerchange', (e: any) => {
        this.currentBaseLayer = e.name;
        if (this.options.onBaseLayerChange) {
          this.options.onBaseLayerChange(e.name);
        }
      });
    }
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
    let drawControl = null;

    if (!readOnlyMap) {
      if (!viewMode) {
        drawControl = new L.Control.Draw({
          draw: drawOptions,
          edit: {
            featureGroup: drawnItems,
            remove: true,
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
    return { map, drawnItems, drawControl };
  }


  // Helper function to create styles based on the JSON layers
  async fetchStyleJson(url) {
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Error fetching style JSON:', error);
      return null;
    }
  }
  getVectorTileOptions(styleJson) {
    return {
      rendererFactory: L.canvas.tile,
      vectorTileLayerStyles: styleJson.layers.reduce((styles, layer) => {
        styles[layer.id] = {
          fill: !!layer.paint?.['fill-color'],
          fillColor: layer.paint?.['fill-color'] || '#AAAAAA',
          fillOpacity: layer.paint?.['fill-opacity'] || 0.6,
          stroke: !!layer.paint?.['line-color'],
          color: layer.paint?.['line-color'] || '#555555',
          weight: layer.paint?.['line-width'] || 1
        };
        return styles;
      }, {})
    };
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

  setBaseLayer(layerName: string) {
    if (this.map && this.baseLayers && this.baseLayers[layerName]) {
      const newLayer = this.baseLayers[layerName];

      // Remove any existing base layer
      Object.values(this.baseLayers).forEach(layer => {
        if (this.map.hasLayer(layer)) {
          this.map.removeLayer(layer);
        }
      });

      newLayer.addTo(this.map);
      this.currentBaseLayer = layerName;
    }
  }

  loadDrawnItems(items) {
    const { drawnItems } = this;
    if (!drawnItems) {
      console.error('drawnItems is undefined');
      return;
    }
    if (!Array.isArray(items)) {
      items = [items];
    }
    // items are stored in a naive fashion for ease
    // of readability for CHEFS reviewers
    const features = this.arrayToFeatureGroup(items);
    features.getLayers().forEach((feature) => {
      if (!this.isFeatureInArray(feature, drawnItems.getLayers())) {
        drawnItems.addLayer(feature);
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

  isDefaultFeature(feature): boolean {
    if (
      this.defaultFeatures == null ||
      this.defaultFeatures?.getLayers() === 0
    ) {
      return false;
    }

    return this.isFeatureInArray(feature, this.defaultFeatures.getLayers());
  }

  isFeatureInArray(feature, array): boolean {
    if (feature === null) return false;
    if (array.length === 0 || array === null) {
      return false;
    }
    const featureType = this.getFeatureType(feature);
    const sameTypes = array.filter((d) => {
      return this.getFeatureType(d) === featureType;
    }); // filter out the types that don't match
    if (sameTypes.length === 0) {
      // no matching types, no match
      return false;
    }
    return sameTypes.some((f) => {
      switch (featureType) {
        case 'marker':
          return this.coordinatesEqual(f.getLatLng(), feature.getLatLng());
        case 'rectangle':
          return f.getBounds() === feature.getBounds();
        case 'circle': {
          const radCheck = f.getRadius() === feature.getRadius();
          const pointCheck = this.coordinatesEqual(
            f.getLatLng(),
            feature.getLatLng()
          );
          return radCheck && pointCheck;
        }

        case 'polygon':
          return this.polyEqual(f.getLatLngs(), feature.getLatLngs());
        case 'polyline':
          return this.polyEqual(f.getLatLngs(), feature.getLatLngs());
        default:
          return false;
      }
    });
  }

  arrayToFeatureGroup(array) {
    const features = new L.FeatureGroup();
    array.forEach((item) => {
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
      features.addLayer(layer);
    });
    return features;
  }

  getFeatureType(feature) {
    if (feature instanceof L.Marker) {
      return 'marker';
    } else if (feature instanceof L.Rectangle) {
      return 'rectangle';
    } else if (feature instanceof L.Circle) {
      return 'circle';
    } else if (feature instanceof L.Polygon) {
      return 'polygon';
    } else if (feature instanceof L.Polyline) {
      return 'polyline';
    }
  }
  coordinatesEqual(c1, c2) {
    return c1.lat === c2.lat && c1.lng === c2.lng;
  }
  polyEqual(c1, c2) {
    if (c1[0] instanceof Array) {
      c1 = c1[0];
    }
    if (c2[0] instanceof Array) {
      c2 = c2[0];
    }
    if (c1.length !== c2.length) {
      // different number of vertices, no match
      return false;
    } else {
      for (let i = 0; i < c1.length; i++) {
        if (!this.coordinatesEqual(c1[i], c2[i])) {
          return false; // if there's no match in one of the points, it's a new feature
        }
      }
      return true;
    }
  }
}
export default MapService;
