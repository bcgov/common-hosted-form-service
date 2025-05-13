import * as L from 'leaflet';
import * as GeoSearch from 'leaflet-geosearch';
import {BCGeocoderProvider} from '../services/BCGeocoderProvider';
import {
  BASE_LAYER_URLS,
  BASE_LAYER_ATTRIBUTIONS,
  DEFAULT_BASE_LAYER,
  DEFAULT_MAP_ZOOM,
  CUSTOM_MARKER_PATH,
  DECIMALS_LATLNG,
  COMPONENT_EDIT_CLASS
} from '../Common/MapConstants';
import 'leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw-src.css';
import 'leaflet-geosearch/dist/geosearch.css';

// Extend HTMLElement to include Leaflet properties
declare global {
  interface HTMLElement {
    _leaflet_id?: number;
  }
}

L.Icon.Default.imagePath = CUSTOM_MARKER_PATH;

interface MapServiceOptions {
  mapContainer: HTMLElement;
  center: [number, number]; // Ensure center is a tuple with exactly two elements
  drawOptions: any;
  drawControl?: any;
  form: HTMLCollectionOf<Element>;
  numPoints: number;
  defaultZoom?: number;
  readOnlyMap?: boolean;
  onDrawnItemsChange: (items: any) => void; // Support both single and multiple items
  viewMode?: boolean;
  myLocation?: boolean;
  bcGeocoder: boolean;
  required?: boolean;
  defaultValue?: any;
  allowBaseLayerSwitch?: boolean;
  selectedBaseLayer?: string;
  onBaseLayerChange?: (layerName: string) => void;
  availableBaseLayers?: string[];
  availableBaseLayersCustom?: any[];
}

class MapService {
  options: MapServiceOptions;
  map: L.Map | null = null;
  drawnItems: L.FeatureGroup | null = null;
  drawControl: L.Control.Draw | null = null;
  defaultFeatures: L.FeatureGroup | null = null;
  currentBaseLayer: string = DEFAULT_BASE_LAYER;
  baseLayers: Record<string, L.TileLayer> = {};
  initialized: boolean = false;
  mapContainer: HTMLElement | null = null;
  // Add flag to prevent event triggering during updates
  isUpdating: boolean = false;

  constructor(options: MapServiceOptions) {
    this.options = options;
    this.mapContainer = options.mapContainer;

    if (options.mapContainer) {
      // Check if the container already has a map (cleanup first if needed)
      if (options.mapContainer._leaflet_id) {
        // console.log('Cleaning up existing map before initializing');
        this.cleanup();
      }

      this.initialize(options);
    }
  }

  // Clean up any existing map instance
  cleanup() {
    try {
      // Remove the map if it exists
      if (this.map) {
        // Remove event listeners to prevent memory leaks
        this.map.off();
        this.map.remove();
        this.map = null;
      }

      // Clear other references
      this.drawnItems = null;
      this.drawControl = null;
      this.defaultFeatures = null;
      this.initialized = false;

      // Remove the leaflet ID from the container if it exists
      if (this.mapContainer && this.mapContainer._leaflet_id) {
        delete this.mapContainer._leaflet_id;
      }
    } catch (error) {
     // console.error('Error during map cleanup:', error);
    }
  }

  async initialize(options: MapServiceOptions) {
    try {
      // First clean up any existing map
      this.cleanup();

      const {map, drawnItems, drawControl} = await this.initializeMap(
        options
      );
      this.map = map;
      this.drawnItems = drawnItems;
      this.drawControl = drawControl; // Store the draw control globally

      // Process default features if they exist
      if (
        this.options.defaultValue !== null &&
        this.options.defaultValue?.features &&
        this.options.defaultValue?.features.length > 0
      ) {
        this.defaultFeatures = this.arrayToFeatureGroup(
          this.options.defaultValue.features
        );
      }

      map.invalidateSize();
      // Triggering a resize event after map initialization
      setTimeout(() => window.dispatchEvent(new Event('resize')), 0);

      // Event listener for drawn objects
      map.on('draw:created', (e) => {
        // Avoid processing events during updates
        if (this.isUpdating) return;

        const layer = e.layer;
        if (!this.drawnItems) {
         // console.error('drawnItems is undefined in draw:created event');
          return;
        }

        if (this.drawnItems.getLayers().length === options.numPoints) {
          map.closePopup();
          L.popup()
            .setLatLng(map.getCenter())
            .setContent(
              `<p>Only ${options.numPoints} features per submission</p>`
            )
            .addTo(map);
        } else {
          this.drawnItems.addLayer(layer);
        }
        this.bindPopupToLayer(layer);

        // Notify parent component of changes
        if (options.onDrawnItemsChange) {
          this.isUpdating = true;
          options.onDrawnItemsChange(this.drawnItems.getLayers());
          setTimeout(() => {
            this.isUpdating = false;
          }, 10);
        }
      });

      map.on(L.Draw.Event.DELETED, (e: any) => {
        // Avoid processing events during updates
        if (this.isUpdating) return;

        if (!this.drawnItems) {
         // console.error('drawnItems is undefined in DELETED event');
          return;
        }

        const form = document.getElementsByClassName('formio')[0];
        const isDesigner =
          form && form.classList.contains('formbuilder');

        if (!isDesigner) {
          e.layers.eachLayer((layer) => {
            const match = this.isDefaultFeature(layer as L.Layer);
            if (match) {
              // re-add the feature/layer to the map
              this.drawnItems?.addLayer(layer);
              L.popup()
                .setLatLng(map.getCenter())
                .setContent('<p>Please do not delete pre-existing features</p>')
                .addTo(map);
            }
          });
        }
        // Notify parent component of changes
        if (options.onDrawnItemsChange) {
          this.isUpdating = true;
          options.onDrawnItemsChange(this.drawnItems.getLayers());
          setTimeout(() => {
            this.isUpdating = false;
          }, 10);
        }
      });

      map.on(L.Draw.Event.EDITSTOP, (e) => {
        // Avoid processing events during updates
        if (this.isUpdating) return;

        if (!this.drawnItems) {
         // console.error('drawnItems is undefined in EDITSTOP event');
          return;
        }

        // Notify parent component of changes
        if (options.onDrawnItemsChange) {
          this.isUpdating = true;
          options.onDrawnItemsChange(this.drawnItems.getLayers());
          setTimeout(() => {
            this.isUpdating = false;
          }, 10);
        }
      });

      map.on('resize', () => {
        map.invalidateSize();
      });

      this.initialized = true;
    } catch (error) {
     // console.error('Error initializing map:', error);
      if (options.mapContainer) {
        options.mapContainer.innerHTML =
          '<div class="alert alert-danger">Error initializing map. Please check console for details.</div>';
      }
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
      allowBaseLayerSwitch,
      availableBaseLayers,
      selectedBaseLayer,
      availableBaseLayersCustom,
    } = options;

    if (drawOptions?.rectangle) {
      drawOptions.rectangle.showArea = false;
    }

    // Check if container already has a map instance
    if (mapContainer._leaflet_id) {
      // console.warn(
      //   'Map container already has a map instance. This should have been cleaned up.'
      // );
      // Ensure cleanup happened before continuing
      const existingMap = L.DomUtil.get(mapContainer);
      if (existingMap && existingMap._leaflet_id) {
        // console.log('Removing existing leaflet instance from DOM element');
        delete existingMap._leaflet_id;
      }
    }

    // Initialize the map
    const map = L.map(mapContainer, {
      zoomAnimation: viewMode || false,
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
      Topographic: L.tileLayer(BASE_LAYER_URLS.Topographic, {
        attribution: BASE_LAYER_ATTRIBUTIONS.Topographic,
      }),
    };

    // Start with built-in base layers
    const selectedBaseLayers = availableBaseLayers
      ? Object.fromEntries(
        Object.entries(allLayers).filter(([key]) =>
          availableBaseLayers.includes(key)
        )
      )
      : {...allLayers};

    // Add enabled custom base layers
    if (availableBaseLayersCustom && Array.isArray(availableBaseLayersCustom)) {
      for (const custom of availableBaseLayersCustom) {
        if (custom?.enabled && custom?.label && custom?.url) {
          selectedBaseLayers[custom.label] = L.tileLayer(custom.url, {
            attribution:
              custom.attribution || BASE_LAYER_ATTRIBUTIONS.OpenStreetMap,
          });
        }
      }
    }
    this.baseLayers = selectedBaseLayers;

    // Pick the initial base layer
    let selectedLayerKey = DEFAULT_BASE_LAYER; // Default fallback

    // First check if specified layer exists in available layers
    if (this.baseLayers[selectedBaseLayer]) {
      selectedLayerKey = selectedBaseLayer;
    } else if (Object.keys(this.baseLayers).length > 0) {
      // Otherwise use first available
      selectedLayerKey = Object.keys(this.baseLayers)[0];
    }

    const selectedLayer = this.baseLayers[selectedLayerKey];
    if (selectedLayer) {
      selectedLayer.addTo(map);
    } else {
      // console.warn('No base layer available to display');
    }

    // Track the base layer that is initially selected
    this.currentBaseLayer = selectedLayerKey;

    // Add geocoder control first (if enabled)
    let geocoderControl = null;
    if (bcGeocoder) {
      try {
        geocoderControl = new (GeoSearch.GeoSearchControl as any)({
          provider: new BCGeocoderProvider(),
          style: 'bar',
          position: 'bottomleft',
          showMarker: false,
          zIndex: 998, // Set a lower z-index
        });
        map.addControl(geocoderControl);

        // After adding to the map, adjust styling if needed
        const controlContainer = geocoderControl.getContainer();
        if (controlContainer) {
          // Make sure z-index is set properly
          controlContainer.style.zIndex = '998'; // Lower than the baselayer control
          controlContainer.style.pointerEvents = 'auto'; // Enable interaction
        }

        map.on('geosearch/showlocation', (e) => {
          L.popup()
            .setLatLng([(e as any).location.y, (e as any).location.x])
            .setContent(`${(e as any).location.label}`)
            .openOn(map);
        });
      } catch (error) {
        // console.error('Error initializing geocoder:', error);
      }
    }

    // Only show layer control if allowed and multiple layers exist
    if (allowBaseLayerSwitch && Object.keys(this.baseLayers).length > 1) {
      const layerControl = L.control.layers(this.baseLayers).addTo(map);
      const controlContainer = layerControl.getContainer();
      if (controlContainer) {
        // Set z-index higher than geocoder
        controlContainer.style.zIndex = '1005'; // Higher than geocoder
        controlContainer.style.pointerEvents = 'auto';
      }

      // Apply CSS to ensure the layer control is above all others
      this.addLayerControlStyle();

      // Modify event handler to prevent loops
      map.on('baselayerchange', (e: any) => {
        // Skip if updating through API
        if (this.isUpdating) return;

        this.currentBaseLayer = e.name;
        if (this.options.onBaseLayerChange) {
          this.isUpdating = true;
          this.options.onBaseLayerChange(e.name);
          setTimeout(() => {
            this.isUpdating = false;
          }, 10);
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
        }, onAdd: () => {
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
                const mapInstance = this.map;
                if (!mapInstance) {
                  // console.warn('Map instance not available');
                  return;
                }
                const latlng = [
                  position.coords.latitude,
                  position.coords.longitude,
                ] as [number, number];

                mapInstance.setView(latlng, 14);
                L.popup()
                  .setLatLng(latlng)
                  .setContent(`(${latlng[0]}, ${latlng[1]})`)
                  .openOn(mapInstance);
              });
            }
          });

          container.title = 'Click to center the map on your location';
          return container;
        }
      });
      const myLocationControl = new myLocationButton();
      myLocationControl.addTo(map);
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
    return {map, drawnItems, drawControl};
  }

  // Helper method to add CSS for layer control
  addLayerControlStyle() {
    // Check if style already exists
    const styleId = 'leaflet-layer-control-style';
    if (document.getElementById(styleId)) {
      return; // Style already exists
    }

    // Create a style element
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .leaflet-control-layers {
        z-index: 1005 !important;
      }
      .leaflet-top, .leaflet-right {
        z-index: 1005 !important;
      }
      .leaflet-control-container .leaflet-top.leaflet-right {
        z-index: 1005 !important;
      }
      .leaflet-control-geosearch {
        z-index: 998 !important;
      }
    `;

    // Add the style to the document head
    document.head.appendChild(style);
  }

  bindPopupToLayer(layer) {
    try {
      if (!layer) {
        // console.warn('Cannot bind popup to undefined layer');
        return;
      }

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
    } catch (error) {
     // console.error('Error binding popup to layer:', error);
    }
  }

  setBaseLayer(layerName: string) {
    try {
      if (!layerName || !this.map || !this.baseLayers) {
        // console.warn(
        //   'Cannot set base layer: missing map, layers, or layer name'
        // );
        return;
      }

      const newLayer = this.baseLayers[layerName];
      if (!newLayer) {
        // console.warn(`Base layer "${layerName}" not found`);
        return;
      }

      // Remove any existing base layer
      Object.values(this.baseLayers).forEach((layer) => {
        if (this.map && this.map.hasLayer(layer)) {
          this.map.removeLayer(layer);
        }
      });

      // Add the new layer and update current base layer name
      if (this.map) {
        newLayer.addTo(this.map);
        this.currentBaseLayer = layerName;
        // Force a redraw in case we're in builder mode
        this.map.invalidateSize();
      }
    } catch (error) {
     // console.error('Error setting base layer:', error);
    }
  }

  loadDrawnItems(items) {
    try {
      if (!this.drawnItems) {
        // console.error('drawnItems is undefined in loadDrawnItems');
        return;
      }

      // Clear existing items first
      this.drawnItems.clearLayers();

      if (!items || (Array.isArray(items) && items.length === 0)) {
        return; // No items to load
      }

      if (!Array.isArray(items)) {
        items = [items];
      }

      // items are stored in a naive fashion for ease
      // of readability for CHEFS reviewers
      const features = this.arrayToFeatureGroup(items);
      if (features) {
        features.getLayers().forEach((feature) => {
          if (this.drawnItems) {
            this.drawnItems.addLayer(feature);
            this.bindPopupToLayer(feature);
          }
        });

        // Inform the component of the current drawn items
        if (this.options.onDrawnItemsChange && this.drawnItems) {
          this.options.onDrawnItemsChange(this.drawnItems.getLayers());
        }
      }
    } catch (error) {
      // console.error('Error loading drawn items:', error);
    }
  }

  hasChildNode(parent, targetNode) {
    if (!parent || !targetNode) return false;

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
    if (!feature) return false;

    if (
      !this.defaultFeatures ||
      !this.defaultFeatures.getLayers ||
      this.defaultFeatures.getLayers().length === 0
    ) {
      return false;
    }

    return this.isFeatureInArray(feature, this.defaultFeatures.getLayers());
  }

  isFeatureInArray(feature, array): boolean {
    if (!feature) return false;
    if (!array || array.length === 0) {
      return false;
    }

    const featureType = this.getFeatureType(feature);
    if (!featureType) return false;

    const sameTypes = array.filter((d) => {
      return this.getFeatureType(d) === featureType;
    }); // filter out the types that don't match

    if (sameTypes.length === 0) {
      // no matching types, no match
      return false;
    }

    return sameTypes.some((f) => {
      try {
        switch (featureType) {
          case 'marker':
            return this.coordinatesEqual(f.getLatLng(), feature.getLatLng());
          case 'rectangle':
            return this.boundsEqual(f.getBounds(), feature.getBounds());
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
      } catch (error) {
        // console.error('Error comparing features:', error);
        return false;
      }
    });
  }

  arrayToFeatureGroup(array) {
    const features = new L.FeatureGroup();

    if (!array || !Array.isArray(array)) {
     // console.warn('Invalid array passed to arrayToFeatureGroup');
      return features;
    }

    array.forEach((item) => {
      try {
        let layer;
        if (item.type === 'marker' && item.coordinates) {
          layer = L.marker(item.coordinates);
        } else if (item.type === 'rectangle' && item.bounds) {
          layer = L.rectangle(item.bounds);
        } else if (item.type === 'circle' && item.coordinates && item.radius) {
          layer = L.circle(item.coordinates, {radius: item.radius});
        } else if (item.type === 'polygon' && item.coordinates) {
          layer = L.polygon(item.coordinates);
        } else if (item.type === 'polyline' && item.coordinates) {
          layer = L.polyline(item.coordinates);
        }

        if (layer) {
          features.addLayer(layer);
          this.bindPopupToLayer(layer);
        }
      } catch (error) {
        // console.error('Error creating layer from item:', item, error);
      }
    });

    return features;
  }

  getFeatureType(feature) {
    if (!feature) return null;

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
    return null;
  }

  coordinatesEqual(c1, c2) {
    if (!c1 || !c2) return false;
    return c1.lat === c2.lat && c1.lng === c2.lng;
  }

  boundsEqual(b1, b2) {
    if (!b1 || !b2) return false;
    return (
      this.coordinatesEqual(b1.getNorthEast(), b2.getNorthEast()) &&
      this.coordinatesEqual(b1.getSouthWest(), b2.getSouthWest())
    );
  }

  polyEqual(c1, c2) {
    if (!c1 || !c2) return false;

    if (c1[0] instanceof Array) {
      c1 = c1[0];
    }
    if (c2[0] instanceof Array) {
      c2 = c2[0];
    }

    if (!c1 || !c2 || c1.length !== c2.length) {
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

  refresh() {
    // Method to refresh the map when in builder mode
    try {
      if (this.map) {
        this.map.invalidateSize();

        // Re-apply current base layer
        if (this.currentBaseLayer) {
          this.setBaseLayer(this.currentBaseLayer);
        }

        // Ensure drawn items are displayed
        if (this.drawnItems && this.options.onDrawnItemsChange) {
          this.options.onDrawnItemsChange(this.drawnItems.getLayers());
        }
      }
    } catch (error) {
     // console.error('Error refreshing map:', error);
    }
  }
}

export default MapService;
