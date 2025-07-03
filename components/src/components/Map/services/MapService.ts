import * as L from 'leaflet';
import * as GeoSearch from 'leaflet-geosearch';
import { BCGeocoderProvider } from '../services/BCGeocoderProvider';
import {
  BASE_LAYER_URLS,
  BASE_LAYER_ATTRIBUTIONS,
  DEFAULT_BASE_LAYER,
  DEFAULT_MAP_ZOOM,
  CUSTOM_MARKER_PATH,
  DECIMALS_LATLNG,
  COMPONENT_EDIT_CLASS,
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
  recenterButton?: boolean; // New option for recenter button
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
  // Store default center and zoom for recenter functionality
  defaultCenter: [number, number];
  defaultZoom: number;

  constructor(options: MapServiceOptions) {
    this.options = options;
    this.mapContainer = options.mapContainer;
    this.defaultCenter = options.center;
    this.defaultZoom = options.defaultZoom || DEFAULT_MAP_ZOOM;
    if (options.mapContainer?._leaflet_id) {
      this.cleanup();
    }
  }
  // New async initialization method, to be called explicitly after creation
  async init(): Promise<void> {
    if (this.mapContainer) {
      await this.initialize(this.options);
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
      if (this.mapContainer?.['_leaflet_id']) {
        delete this.mapContainer._leaflet_id;
      }
    } catch (error) {
      console.error('Error during map cleanup:', error);
    }
  }

  async initialize(options: MapServiceOptions) {
    try {
      // First clean up any existing map
      this.cleanup();

      const { map, drawnItems, drawControl } = await this.initializeMap(
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
          return;
        }

        const form = document.getElementsByClassName('formio')[0];
        const isDesigner = form?.classList.contains('formbuilder') ?? false;

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
      console.error('Error initializing map:', error);
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
      recenterButton,
    } = options;

    if (drawOptions?.rectangle) {
      drawOptions.rectangle.showArea = false;
    }

    this.cleanupMapContainer(mapContainer);

    const map = this.createMapInstance(
      mapContainer,
      center,
      defaultZoom,
      viewMode
    );

    this.baseLayers = this.setupBaseLayers(
      availableBaseLayers,
      availableBaseLayersCustom
    );
    const selectedLayerKey = this.pickInitialBaseLayer(selectedBaseLayer);
    this.currentBaseLayer = selectedLayerKey;

    this.baseLayers[selectedLayerKey]?.addTo(map);

    this.setupGeocoderControl(map, bcGeocoder);
    this.setupBaseLayerSwitchControl(map, allowBaseLayerSwitch);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    if (myLocation) {
      this.addMyLocationControl(map);
    }

    // Add recenter button if enabled
    if (recenterButton) {
      this.addRecenterControl(map);
    }

    const drawControl = this.addDrawControl(
      map,
      drawOptions,
      readOnlyMap,
      viewMode,
      drawnItems
    );
    this.handleFormInteractions(
      Array.from(form ?? []) as HTMLElement[],
      map,
      mapContainer
    );

    return { map, drawnItems, drawControl };
  }

  // --- Helper functions ---

  private cleanupMapContainer(mapContainer: HTMLElement) {
    if (mapContainer._leaflet_id) {
      const existingMap = L.DomUtil.get(mapContainer);
      if (existingMap?._leaflet_id) {
        delete existingMap._leaflet_id;
      }
    }
  }

  private createMapInstance(
    mapContainer: HTMLElement,
    center: L.LatLngExpression,
    defaultZoom?: number,
    viewMode?: boolean
  ) {
    return L.map(mapContainer, { zoomAnimation: viewMode || false }).setView(
      center,
      defaultZoom || DEFAULT_MAP_ZOOM
    );
  }

  private setupBaseLayers(
    availableBaseLayers?: string[],
    availableBaseLayersCustom?: {
      enabled: boolean;
      label: string;
      url: string;
      attribution?: string;
    }[]
  ) {
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

    const selectedBaseLayers = availableBaseLayers
      ? Object.fromEntries(
          Object.entries(allLayers).filter(([key]) =>
            availableBaseLayers.includes(key)
          )
        )
      : { ...allLayers };

    if (availableBaseLayersCustom && Array.isArray(availableBaseLayersCustom)) {
      for (const custom of availableBaseLayersCustom) {
        if (custom?.enabled && custom?.label && custom?.url) {
          selectedBaseLayers[custom.label] = L.tileLayer(custom.url, {
            attribution:
              custom.attribution ?? BASE_LAYER_ATTRIBUTIONS.OpenStreetMap,
          });
        }
      }
    }

    return selectedBaseLayers;
  }

  private pickInitialBaseLayer(selectedBaseLayer?: string) {
    if (this.baseLayers[selectedBaseLayer]) {
      return selectedBaseLayer;
    }
    const keys = Object.keys(this.baseLayers);
    return keys.length > 0 ? keys[0] : DEFAULT_BASE_LAYER;
  }

  private setupGeocoderControl(map: L.Map, bcGeocoder?: boolean) {
    if (!bcGeocoder) return;

    try {
      const geocoderControl = new (GeoSearch.GeoSearchControl as any)({
        provider: new BCGeocoderProvider(),
        style: 'bar',
        position: 'bottomleft',
        showMarker: false,
        zIndex: 998,
      });
      map.addControl(geocoderControl);

      const controlContainer = geocoderControl.getContainer();
      if (controlContainer) {
        controlContainer.style.zIndex = '998';
        controlContainer.style.pointerEvents = 'auto';
      }

      map.on('geosearch/showlocation', (e: any) => {
        L.popup()
          .setLatLng([e.location.y, e.location.x])
          .setContent(`${e.location.label}`)
          .openOn(map);
      });
    } catch (error) {
      console.error('Error initializing geocoder:', error);
    }
  }

  private setupBaseLayerSwitchControl(
    map: L.Map,
    allowBaseLayerSwitch?: boolean
  ) {
    if (!allowBaseLayerSwitch || Object.keys(this.baseLayers).length <= 1)
      return;

    const layerControl = L.control.layers(this.baseLayers).addTo(map);
    const controlContainer = layerControl.getContainer();

    if (controlContainer) {
      controlContainer.style.zIndex = '1005';
      controlContainer.style.pointerEvents = 'auto';
    }

    this.addLayerControlStyle();

    map.on('baselayerchange', (e: any) => {
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

  private addMyLocationControl(map: L.Map) {
    const myLocationButton = L.Control.extend({
      options: {
        position: 'bottomright',
      },
      onAdd: () => {
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
              if (!mapInstance) return;

              const latlng: [number, number] = [
                position.coords.latitude,
                position.coords.longitude,
              ];
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
      },
    });
    new myLocationButton().addTo(map);
  }

  private addRecenterControl(map: L.Map) {
    const recenterButton = L.Control.extend({
      options: {
        position: 'bottomright',
      },
      onAdd: () => {
        const container = L.DomUtil.create(
          'div',
          'leaflet-bar leaflet-control'
        );
        const button = L.DomUtil.create(
          'a',
          'leaflet-control-button',
          container
        );
        button.innerHTML = '<i class="fa fa-home"></i>';
        L.DomEvent.disableClickPropagation(button);

        L.DomEvent.on(button, 'click', () => {
          const mapInstance = this.map;
          if (!mapInstance) return;

          // Reset map to default center and zoom
          mapInstance.setView(this.defaultCenter, this.defaultZoom);
          // Optional: Show a brief popup indicating the map was recentered
          L.popup()
            .setLatLng(this.defaultCenter)
            .setContent('<p>Map recentered to default view</p>')
            .addTo(mapInstance);
          // Auto-close the popup after 2 seconds
          setTimeout(() => {
            mapInstance.closePopup();
          }, 2000);
        });

        container.title = 'Click to recenter the map to default view';
        return container;
      },
    });
    new recenterButton().addTo(map);
  }

  private addDrawControl(
    map: L.Map,
    drawOptions: L.Control.DrawOptions,
    readOnlyMap?: boolean,
    viewMode?: boolean,
    drawnItems?: L.FeatureGroup
  ) {
    if (readOnlyMap || viewMode) return null;

    const drawControl = new L.Control.Draw({
      draw: drawOptions,
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);
    return drawControl;
  }

  private handleFormInteractions(
    form: HTMLElement[],
    map: L.Map,
    mapContainer: HTMLElement
  ) {
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
      if (!layer) return;

      const getFormattedCoordinates = (latLng) =>
        `(${latLng.lat.toFixed(DECIMALS_LATLNG)},${latLng.lng.toFixed(
          DECIMALS_LATLNG
        )})`;

      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        const latLng = layer.getLatLng();
        layer
          .bindPopup(`<p>${getFormattedCoordinates(latLng)}</p>`)
          .openPopup();
      } else if (layer instanceof L.Rectangle || layer instanceof L.Polygon) {
        const center = layer.getBounds().getCenter();
        layer
          .bindPopup(`<p>${getFormattedCoordinates(center)}</p>`)
          .openPopup();
      }
    } catch (error) {
      console.error('Error binding popup to layer:', error);
    }
  }

  setBaseLayer(layerName: string) {
    try {
      if (!layerName || !this.map || !this.baseLayers) {
        return;
      }

      const newLayer = this.baseLayers[layerName];
      if (!newLayer) {
        return;
      }

      // Check if map exists before proceeding
      if (this.map && this.baseLayers) {
        // Remove any existing base layer
        Object.values(this.baseLayers).forEach((layer) => {
          if (this.map.hasLayer?.(layer)) {
            this.map.removeLayer(layer);
          }
        });
      } else {
        console.warn('Map or baseLayers not initialized.');
      }

      // Add the new layer and update current base layer name
      if (this.map) {
        newLayer.addTo(this.map);
        this.currentBaseLayer = layerName;
        // Force a redraw in case we're in builder mode
        this.map.invalidateSize();
      }
    } catch (error) {
      console.error('Error setting base layer:', error);
    }
  }

  loadDrawnItems(items) {
    try {
      if (!this.drawnItems) {
        console.error('drawnItems is undefined in loadDrawnItems');
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
      console.error('Error loading drawn items:', error);
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

    if (!this.defaultFeatures?.getLayers?.()?.length) {
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
        console.error('Error comparing features:', error);
        return false;
      }
    });
  }

  arrayToFeatureGroup(array) {
    const features = new L.FeatureGroup();

    if (!array || !Array.isArray(array)) {
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
          layer = L.circle(item.coordinates, { radius: item.radius });
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
        console.error('Error creating layer from item:', item, error);
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
      console.error('Error refreshing map:', error);
    }
  }
}

export default MapService;
