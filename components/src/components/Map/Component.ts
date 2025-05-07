import { Components } from 'formiojs';

const FieldComponent = (Components as any).components.field;
import MapService from './services/MapService';
import baseEditForm from './Component.form';
import * as L from 'leaflet';
import { DEFAULT_BASE_LAYER } from './Common/MapConstants';

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
      defaultValue: { features: [], selectedBaseLayer: DEFAULT_BASE_LAYER },
      allowBaseLayerSwitch: false,
      availableBaseLayers: {
        OpenStreetMap: true,
        Light: true,
        Dark: true,
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
  mapService: MapService | null = null;
  initialized: boolean = false;
  mapContainer: HTMLElement | null = null;
  mapInitializationAttempts: number = 0;
  maxInitializationAttempts: number = 3;
  // Add flag to prevent update loops
  updatingFromMapService: boolean = false;
  skipNextUpdate: boolean = false;
  lastSavedValue: any = null;

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

    // Reset initialization attempts on new attachment
    this.mapInitializationAttempts = 0;

    // Clear any previous map service
    if (this.mapService) {
      this.cleanupMap();
    }

    // Add a small delay to ensure the DOM element is fully created
    setTimeout(() => {
      try {
        this.loadMap();
      } catch (error) {
        console.error('Error loading map:', error);
        // Display error message in the map container
        const mapContainer = document.getElementById(`map-${this.componentID}`);
        if (mapContainer) {
          mapContainer.innerHTML =
            '<div class="alert alert-danger">Error loading map. Please check console for details.</div>';
        }
      }
    }, 100);
    return superAttach;
  }

  cleanupMap() {
    if (this.mapService) {
      try {
        // Call cleanup method of the MapService
        if (typeof this.mapService.cleanup === 'function') {
          this.mapService.cleanup();
        }
        this.mapService = null;
      } catch (error) {
        console.error('Error cleaning up map:', error);
      }
    }
    this.initialized = false;
  }

  loadMap() {
    // Get the map container element
    this.mapContainer = document.getElementById(`map-${this.componentID}`);
    if (!this.mapContainer) {
      console.error(`Map container with ID map-${this.componentID} not found`);

      // Try again up to max attempts if container not found
      if (this.mapInitializationAttempts < this.maxInitializationAttempts) {
        this.mapInitializationAttempts++;
        setTimeout(() => this.loadMap(), 200);
      }
      return;
    }

    // Check if container already has a map instance
    if (this.mapContainer._leaflet_id) {
      console.log('Map container already has a map. Cleaning up first.');
      this.cleanupMap();

      // Delete the leaflet ID from the container element
      delete this.mapContainer._leaflet_id;
    }

    const form = document.getElementsByClassName('formio');

    const drawOptions = {
      rectangle: null,
      circle: false,
      polyline: false,
      polygon: false,
      circlemarker: false,
      marker: false,
    };

    // Set marker type from user choice
    if (this.component.markerType) {
      try {
        for (const [key, value] of Object.entries(this.component.markerType)) {
          drawOptions[key] = value;
        }
      } catch (error) {
        console.error('Error setting marker types:', error);
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

    // Set initial center with proper error handling
    let initialCenter;
    try {
      if (center?.features?.[0]?.coordinates) {
        initialCenter = center.features[0].coordinates;
      } else {
        initialCenter = DEFAULT_CENTER;
      }
    } catch (error) {
      console.error('Error setting map center:', error);
      initialCenter = DEFAULT_CENTER;
    }

    // Get selected base layer from data or use default
    const selectedBaseLayer =
      this.dataValue?.selectedBaseLayer || DEFAULT_BASE_LAYER;

    try {
      // Determine what default value to use
      const effectiveDefaultValue = this.dataValue && this.dataValue.features
        ? this.dataValue
        : defaultValue && defaultValue.features
          ? defaultValue
          : { features: [], selectedBaseLayer };

      // Store the initial value to avoid unnecessary updates
      this.lastSavedValue = JSON.stringify(effectiveDefaultValue);

      console.log('Initializing map with default value:', effectiveDefaultValue);

      this.mapService = new MapService({
        mapContainer: this.mapContainer,
        drawOptions,
        center: initialCenter,
        form,
        numPoints: numPoints || 1, // Default to 1 if not specified
        defaultZoom,
        readOnlyMap: !allowSubmissions, // if allow submissions, read only is false
        defaultValue: effectiveDefaultValue, // Pass the effective default value
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

      // Force load drawn items manually after MapService is fully initialized
      if (effectiveDefaultValue?.features && effectiveDefaultValue.features.length > 0) {
        try {
          // Add a small delay to ensure the map is ready before loading features
          setTimeout(() => {
            console.log('Loading drawn items:', effectiveDefaultValue.features);
            if (this.mapService) {
              this.skipNextUpdate = true; // Prevent update loop when loading initial features
              this.mapService.loadDrawnItems(effectiveDefaultValue.features);
            }
          }, 100);
        } catch (error) {
          console.error('Error loading drawn items:', error);
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize map service:', error);
      if (this.mapContainer) {
        this.mapContainer.innerHTML =
          '<div class="alert alert-danger">Failed to initialize map. Please check console for details.</div>';
      }
    }
  }

  // Helper method to create a safe serialized version of the value
  // This avoids circular references that cause maximum call stack size exceeded
  serializeValue(value) {
    if (!value) return '';

    try {
      // Create a simplified representation for comparison
      const simplifiedValue = {
        features: value.features ? value.features.map(feature => {
          const result = { type: feature.type };

          if (feature.coordinates) {
            if (feature.type === 'marker' || feature.type === 'circle') {
              // For point features, just store lat/lng as strings
              result.coordinates = `${feature.coordinates.lat},${feature.coordinates.lng}`;
            } else if (feature.type === 'polyline' || feature.type === 'polygon') {
              // For line/polygon features, create a string hash of coordinates
              result.coordinates = JSON.stringify(feature.coordinates)
                .replace(/[{}"]/g, ''); // Remove JSON syntax characters
            }
          }

          if (feature.bounds) {
            // For rectangles, create a string representation of bounds
            const bounds = feature.bounds;
            result.bounds = `${bounds._southWest.lat},${bounds._southWest.lng},${bounds._northEast.lat},${bounds._northEast.lng}`;
          }

          if (feature.radius) {
            result.radius = feature.radius;
          }

          return result;
        }) : [],
        selectedBaseLayer: value.selectedBaseLayer || DEFAULT_BASE_LAYER
      };

      return JSON.stringify(simplifiedValue);
    } catch (error) {
      console.error('Error serializing value:', error);
      return '';
    }
  }

  // Modified to prevent update loops and fix circular reference issues
  saveDrawnItems(drawnItems: L.Layer[]) {
    try {
      if (this.updatingFromMapService) {
        //console.log('Skipping saveDrawnItems call during value update');
        return;
      }

      const features = drawnItems
        .map((layer: any) => {
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
          return null;
        })
        .filter((feature) => feature !== null);

      // Get current value to preserve base layer
      const currentValue = this.getValue() || {
        features: [],
        selectedBaseLayer: DEFAULT_BASE_LAYER,
      };

      // Create new value with updated features but same base layer
      const newValue = {
        features,
        selectedBaseLayer: currentValue.selectedBaseLayer,
      };

      // Serialize for comparison - using our safe serialization method
      const newValueStr = this.serializeValue(newValue);

      // Skip if no actual change
      if (this.lastSavedValue === newValueStr) {
        // console.log('No change in drawn items, skipping update');
        return;
      }

      // Update the value
      this.skipNextUpdate = true;
      this.setValue(newValue);
      this.lastSavedValue = newValueStr;
    } catch (error) {
      console.error('Error saving drawn items:', error);
    }
  }

  // Modified to prevent update loops and fix circular reference issues
  setValue(value) {
    if (!value) return;

    try {
      // Skip this update if flagged (prevents loops)
      if (this.skipNextUpdate) {
        // console.log('Skipping setValue due to skipNextUpdate flag');
        this.skipNextUpdate = false;
        return super.setValue(value);
      }

      const currentValue = this.getValue() || {
        features: [],
        selectedBaseLayer: DEFAULT_BASE_LAYER,
      };

      // Ensure we have valid structures
      const newValue = {
        features: value.features || [],
        selectedBaseLayer: value.selectedBaseLayer || currentValue.selectedBaseLayer,
      };

      // Serialize for comparison using our safe method
      const currentValueStr = this.serializeValue(currentValue);
      const newValueStr = this.serializeValue(newValue);

      // If values are exactly the same, do nothing
      if (currentValueStr === newValueStr) {
        // console.log('Values are identical, skipping setValue');
        return;
      }

      // Call the parent setValue method
      const result = super.setValue(newValue);

      // Update the stored last value
      this.lastSavedValue = newValueStr;

      // Update the map if it's initialized
      if (this.initialized && this.mapService) {
        // Set flag to prevent event handler loops
        this.updatingFromMapService = true;

        // Update features if they changed
        if (newValue.features && currentValueStr !== newValueStr) {
         // console.log('Loading new features onto map:', newValue.features);
          this.mapService.loadDrawnItems(newValue.features);
        }

        // Update base layer if it changed
        if (currentValue.selectedBaseLayer !== newValue.selectedBaseLayer) {
          this.mapService.setBaseLayer(newValue.selectedBaseLayer);
        }

        // Reset flag after short delay to allow events to complete
        setTimeout(() => {
          this.updatingFromMapService = false;
        }, 10);
      } else {
        // console.log('Map not initialized yet, value will be applied when ready');
      }

      return result;
    } catch (error) {
      console.error('Error setting value:', error);
      return super.setValue(value);
    } finally {
      // Always clear the skip flag to prevent getting stuck
      this.skipNextUpdate = false;
    }
  }

  getValue() {
    return (
      this.dataValue || { features: [], selectedBaseLayer: DEFAULT_BASE_LAYER }
    );
  }

  isEmpty(value) {
    if (!this.component.allowSubmissions) return false;

    try {
      // Make sure we have valid values to compare
      const featuresLength = value?.features?.length || 0;
      const defaultFeaturesLength =
        this.component.defaultValue?.features?.length || 0;

      return featuresLength === 0 || featuresLength === defaultFeaturesLength;
    } catch (error) {
      console.error('Error checking if empty:', error);
      return false;
    }
  }

  // Modified to prevent update loops
  saveBaseLayer(layerName: string) {
    if (!layerName) return;

    try {
      // Skip if we're currently updating from map service
      if (this.updatingFromMapService) {
        // console.log('Skipping saveBaseLayer call during value update');
        return;
      }

      const currentValue = this.getValue() || {
        features: [],
        selectedBaseLayer: DEFAULT_BASE_LAYER,
      };

      if (currentValue.selectedBaseLayer !== layerName) {
        const newValue = {
          ...currentValue,
          selectedBaseLayer: layerName,
        };

        // Set flag to avoid double update
        this.skipNextUpdate = true;
        this.setValue(newValue);
        this.lastSavedValue = this.serializeValue(newValue);
      }
    } catch (error) {
      console.error('Error saving base layer:', error);
    }
  }

  // Make sure component refreshes properly in the builder
  updateValue(flags) {
    const result = super.updateValue(flags);

    // Force redraw when in builder mode, but avoid loops
    if (this.options.builder && this.initialized && this.mapService && !this.updatingFromMapService) {
      try {
        this.mapService.refresh();
      } catch (error) {
        console.error('Error refreshing map in builder:', error);
      }
    }

    return result;
  }

  // Add support for builder events
  builderReady() {
    if (super.builderReady) {
      super.builderReady();
    }

    // Force map to initialize in the builder preview
    if (this.options.builder) {
      setTimeout(() => {
        if (!this.initialized) {
          try {
            this.loadMap();
          } catch (error) {
            console.error('Error loading map in builder:', error);
          }
        }
      }, 500);
    }
  }
}
