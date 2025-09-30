/* tslint:disable */
import { Components } from 'formiojs';
import autocompleter from 'autocompleter';
import _ from 'lodash';

const ParentComponent = (Components as any).components.address;

export interface ShadowDOMAddressConfig {
  componentId: string;
  displayName: string;
  providerOptions?: {
    queryProperty?: string;
    url?: string;
  };
  queryParameters?: {
    echo?: boolean;
    brief?: boolean;
    minScore?: number;
    onlyCivic?: boolean;
    maxResults?: number;
    autocomplete?: boolean;
    matchAccuracy?: number;
    matchPrecision?: string;
    precisionPoints?: number;
  };
}

export abstract class ShadowDOMAddressComponent extends ParentComponent {
  private _autocompleterInstances: any[] = [];
  private _bodyMonitorInterval: number | null = null;

  protected abstract getConfig(): ShadowDOMAddressConfig;

  static createSchema(config: ShadowDOMAddressConfig, ...extend: any[]) {
    const baseSchema: any = {
      label: config.displayName,
      type: config.componentId,
      key: config.componentId,
    };

    // Only add provider configuration if it's specified in config
    if (config.providerOptions || config.queryParameters) {
      baseSchema.provider = 'custom';
      baseSchema.providerOptions = {
        queryProperty: 'addressString',
        url: import.meta.env.VITE_CHEFS_GEO_ADDRESS_APIURL,
        ...config.providerOptions,
      };
      baseSchema.queryParameters = {
        echo: false,
        brief: true,
        minScore: 55,
        onlyCivic: true,
        maxResults: 15,
        autocomplete: true,
        matchAccuracy: 100,
        matchPrecision:
          'occupant, unit, site, civic_number, intersection, block, street, locality, province',
        precisionPoints: 100,
        ...config.queryParameters,
      };
    }

    return ParentComponent.schema(baseSchema, ...extend);
  }

  constructor(...args: any[]) {
    super(...args);

    const config = this.getConfig();
    if (this.options?.componentOptions) {
      // componentOptions are passed in from the viewer, basically runtime configuration
      const opts = this.options.componentOptions[config.componentId];
      if (opts?.providerOptions) {
        // Override the compile-time providerOptions.url with runtime value
        this.component.providerOptions = {
          ...this.component.providerOptions,
          ...opts.providerOptions,
        };
      }
    }
  }

  mergeSchema(component = {}) {
    let components = component['components'];

    if (components) {
      return _.omit(component, 'components');
    }

    return component;
  }

  async init() {
    super.init();
  }

  attach(element: any) {
    const config = this.getConfig();
    const shadowRoot =
      this.options?.componentOptions?.[config.componentId]?.shadowRoot;
    const result = shadowRoot
      ? this._shadowRootAttach(shadowRoot, element)
      : super.attach(element);

    try {
      let { providerOptions, queryParameters } = this.component;
      if (providerOptions) {
        if (!providerOptions.params) {
          providerOptions['params'] = {};
        }
        if (queryParameters) {
          providerOptions.params = {
            ...providerOptions.params,
            ...queryParameters,
          };
        }
      }
    } catch (err: any) {
      console.log(
        `This error is from Custom ${
          this.getConfig().displayName
        } component in form.io: Failed to acquire configuration: ${err.message}`
      );
    }
    return result;
  }

  private _shadowRootAttach(shadowRoot: any, element: any) {
    let result: any;
    result = super.attach(element);
    // Now create your custom Shadow DOM autocompleter
    this._configureShadowDOMAutocompleters(shadowRoot);

    return result;
  }

  private _configureShadowDOMAutocompleters(shadowRoot: any) {
    if (!shadowRoot || this.builderMode || !this.searchInput) {
      // early return if not in shadow root or builder mode or no search inputs
      return;
    }

    const config = this.getConfig();

    for (const [index, element] of this.searchInput.entries()) {
      if (element && this.provider && this.component.provider !== 'google') {
        const componentKey =
          this.component.key ||
          // Fallback: Use component type + generated ID
          `${config.componentId}-${
            this.id ||
            Date.now().toString(36) + Math.random().toString(36).substring(2)
          }`;

        let permanentContainer = shadowRoot.querySelector(
          '#bcaddress-autocomplete-container'
        );
        if (!permanentContainer) {
          permanentContainer = document.createElement('div');
          permanentContainer.id = 'bcaddress-autocomplete-container';
          permanentContainer.style.cssText = 'position: relative;';
          shadowRoot.appendChild(permanentContainer);
        }

        const containerId = `autocomplete-${componentKey}-${index}`;

        let container = permanentContainer.querySelector(`#${containerId}`);
        if (!container) {
          container = document.createElement('div');
          container.id = containerId;
          container.className = 'autocomplete-suggestions';
          container.style.cssText =
            'position: absolute; z-index: 1000; top: 0; left: 0;';
          container.setAttribute('data-shadow-dom-autocomplete', 'true');
          permanentContainer.appendChild(container);
        }

        // STEP 1: Capture existing body autocompleters before creating ours
        const existingBodyAutocompleters = new Set(
          Array.from(document.querySelectorAll('body > .autocomplete')).map(
            (el) => el
          )
        );

        // Create autocompleter with Shadow DOM container
        const autocompleterInstance = autocompleter({
          input: element,
          container: container,
          debounceWaitMs: 300,
          fetch: (text: string, update: (results: any[]) => void) => {
            const query = text;
            this.provider
              .search(query)
              .then((results: any[]) => {
                // STEP 2: Set up continuous monitoring for body autocompleters while typing
                this._startBodyAutocompleterMonitoring(
                  existingBodyAutocompleters
                );
                update(results);
              })
              .catch(() => {
                update([]);
              });
          },
          render: (address: any) => {
            const div = this.ce('div');
            div.textContent = this.getDisplayValue(address);
            return div;
          },
          onSelect: (address: any) => {
            // Stop monitoring when user selects an address
            this._stopBodyAutocompleterMonitoring();
            this.onSelectAddress(address, element, index);
          },
        });

        // Set up the blur and keyup events that the parent would normally set up
        this.addEventListener(element, 'blur', () => {
          // Stop monitoring when input loses focus
          this._stopBodyAutocompleterMonitoring();

          if (element.value) {
            element.value = this.getDisplayValue(
              this.isMultiple ? this.address[index] : this.address
            );
          }
        });

        this.addEventListener(element, 'keyup', () => {
          if (!element.value) {
            this.clearAddress(element, index);
          }
        });

        // Store reference to autocompleter instance for cleanup
        if (!this._autocompleterInstances) this._autocompleterInstances = [];
        this._autocompleterInstances.push(autocompleterInstance);
      }
    }
  }

  private _startBodyAutocompleterMonitoring(
    existingAutocompleters: Set<Element>
  ) {
    // Stop any existing monitoring first
    this._stopBodyAutocompleterMonitoring();
    // Check immediately and then every 100ms while typing
    this._removeNewBodyAutocompleters(existingAutocompleters);
    this._bodyMonitorInterval = setInterval(() => {
      this._removeNewBodyAutocompleters(existingAutocompleters);
    }, 100);
  }

  private _stopBodyAutocompleterMonitoring() {
    if (this._bodyMonitorInterval) {
      clearInterval(this._bodyMonitorInterval);
      this._bodyMonitorInterval = null;
    }
  }

  private _removeNewBodyAutocompleters(existingAutocompleters: Set<Element>) {
    // Find any new body autocompleters that weren't there before
    const currentBodyAutocompleters = document.querySelectorAll(
      'body > .autocomplete'
    );

    for (const el of Array.from(currentBodyAutocompleters)) {
      // If this autocompleter wasn't in our pre-creation snapshot, it's new
      if (
        !existingAutocompleters.has(el) &&
        !el.hasAttribute('data-shadow-dom-autocomplete')
      ) {
        el.remove();
      }
    }
  }

  destroy() {
    // Stop any active monitoring
    this._stopBodyAutocompleterMonitoring();

    // Clean up autocompleter instances
    if (this._autocompleterInstances) {
      for (const instance of Array.from(this._autocompleterInstances)) {
        instance?.destroy?.();
      }
      this._autocompleterInstances = [];
    }

    // Call parent destroy
    if (super.destroy) {
      super.destroy();
    }
  }
}
