/**
 * chefs-form-viewer-embed.js
 *
 * Simplified embedding script for chefs-form-viewer component inspired by Form.io's
 * quick inline embedding approach. This script enables one-line form embedding via
 * URL parameters without requiring manual component setup.
 *
 * @example Basic Usage
 * <script src="/app/embed/chefs-form-viewer-embed.js?form-id=123&auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."></script>
 *
 * @example Advanced Usage with Global Config
 * <script>
 *   globalThis.ChefsViewerConfig = {
 *     token: { roles: ['admin'], sub: 'user123' },
 *     user: { name: 'John Doe', department: 'IT' },
 *     headers: { 'X-Custom-Header': 'value', 'Authorization': 'Bearer ...' },
 *     // Override endpoints for custom CDN or local assets
 *     endpoints: {
 *       mainCss: 'https://mycdn.com/chefs-styles.css',
 *       formioJs: 'https://mycdn.com/formio.js',
 *       themeCss: 'https://mycdn.com/custom-theme.css'
 *     },
 *     before: function(element, params) {
 *       // Configure element before loading
 *       element.isolateStyles = true;
 *     },
 *     after: function(element, formioInstance) {
 *       // Add event listeners after form loads
 *       element.addEventListener('formio:submitDone', handleSubmit);
 *     },
 *     onMetadataLoaded: function(metadata) {
 *       // React to form metadata being loaded
 *       document.title = metadata.formName;
 *     }
 *   };
 * </script>
 * <script src="/app/embed/chefs-form-viewer-embed.js?form-id=123&auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."></script>
 *
 * @author CHEFS Team
 * @since 1.5.0
 *
 * ## Embedding Algorithm
 *
 * 1. **Script Discovery**: Locates the current script element via document.currentScript
 * 2. **Parameter Parsing**: Extracts query parameters from the script src URL
 * 3. **Debug Setup**: Enables logging based on debug parameter or global flag
 * 4. **Component Loading**: Dynamically loads chefs-form-viewer.js if not already present
 * 5. **Element Creation**: Creates <chefs-form-viewer> element in memory
 * 6. **Parameter Application**: Converts URL parameters to element attributes/properties
 * 7. **Global Configuration**: Applies globalThis.ChefsViewerConfig settings if available
 * 8. **Event Setup**: Attaches metadata extraction listeners before form loading
 * 9. **DOM Insertion**: Replaces script tag with form element in the same position
 * 10. **Form Loading**: Calls element.load() to fetch and render the form
 * 11. **Post-Load Hooks**: Executes after callbacks and emits completion events
 *
 * ## Metadata Access Methods
 *
 * The embed script provides three ways to access form metadata (name, description, etc.):
 *
 * ### Method 1: Element Properties (Available after formio:loadSchema)
 * ```javascript
 * const element = document.querySelector('chefs-form-viewer');
 * console.log(element.formName);        // "Contact Form"
 * console.log(element.formDescription); // "Submit your inquiry"
 * console.log(element.formMetadata);    // { name: "Contact Form", ... }
 * ```
 *
 * ### Method 2: Global Event (Dispatched on globalThis)
 * ```javascript
 * globalThis.addEventListener('chefs-form-viewer:metadata-loaded', function(e) {
 *   console.log(e.detail.formName);        // "Contact Form"
 *   console.log(e.detail.formDescription); // "Submit your inquiry"
 *   console.log(e.detail.form);            // Full form object
 * });
 * ```
 *
 * ### Method 3: Global Callback (Set before script loads)
 * ```javascript
 * globalThis.ChefsViewerConfig = {
 *   onMetadataLoaded: function(metadata) {
 *     console.log(metadata.formName);        // "Contact Form"
 *     console.log(metadata.formDescription); // "Submit your inquiry"
 *   }
 * };
 * ```
 *
 * ## Supported Parameters
 *
 * All chefs-form-viewer attributes can be passed as URL query parameters:

 * **Required:**
 * - `form-id`: CHEFS form UUID
 * - `auth-token`: JWT authentication token (preferred)
 *   - The auth-token should be fetched by your backend server using the protected api-key and form-id via POST /app/gateway/v1/auth/token/forms/<form-id>.
 *   - The backend should return the short-lived, refreshable token to the frontend for embedding and authenticating form access.
 * - `api-key`: API access key (fallback, only if auth-token is not available)

 * **Optional:**
 * - `submission-id`: Load specific submission (for editing/viewing)
 * - `read-only`: Render form as read-only (true/false)
 * - `language`: Form language (en, fr, etc.)
 * - `base-url`: Override API base URL
 * - `debug`: Enable debug logging (true/false)
 * - `isolate-styles`: Use Shadow DOM isolation (true/false)
 * - `no-icons`: Disable Font Awesome icons (true/false)
 * - `theme-css`: Custom theme CSS URL
 * - `auto-reload-on-submit`: Auto-reload form as read-only after submission (true/false, default: true)
 * - `submit-button-key`: Form.io component key for the submit button (default: submit)
 * - `print-button-key`: Form.io component key for the print Action button (default: print)
 * - `print-event-name`: Form.io Event action name that triggers printing (default: printDocument)
 * - `token`: URL-encoded JSON JWT token object
 * - `user`: URL-encoded JSON user object
 * - `headers`: URL-encoded JSON headers object
 *
 * ## Error Handling
 *
 * The embed script includes comprehensive error handling:
 * - Invalid JSON parameters are logged as warnings and ignored
 * - Component loading failures show user-friendly error messages
 * - Global config callback errors are caught and logged
 * - Script insertion errors gracefully degrade to error display
 *
 * ## Performance Notes
 *
 * - Component script is loaded only once (cached on subsequent embeds)
 * - Custom elements definition is awaited to ensure proper initialization
 * - Parameters are applied before form loading to avoid re-renders
 * - Event listeners are attached before loading to capture all events
 */
(() => {
  'use strict';

  const NAMESPACE = 'chefs-form-viewer-embed';

  // Utility functions that can be tested independently

  /**
   * Parse string parameter value as boolean following web standard conventions.
   * Treats 'true', '1', and empty string as truthy (HTML attribute behavior).
   * All other values including 'false', '0', undefined, null are falsy.
   *
   * @param {string|undefined|null} value - Parameter value to parse
   * @returns {boolean} Parsed boolean value
   * @example
   * parseBooleanParam('true') // Returns: true
   * parseBooleanParam('1') // Returns: true
   * parseBooleanParam('') // Returns: true (HTML attribute present)
   * parseBooleanParam('false') // Returns: false
   * parseBooleanParam('0') // Returns: false
   * parseBooleanParam(undefined) // Returns: false
   */
  function parseBooleanParam(value) {
    return value === 'true' || value === '1' || value === '';
  }

  /**
   * Creates a conditional logger that only outputs when debugging is enabled.
   * Provides consistent logging format with namespace prefix.
   *
   * @param {boolean} enabled - Whether to enable logging output
   * @returns {Object} Logger object with debug, info, warn, error methods
   * @example
   * const logger = createLogger(true);
   * logger.info('Component loaded', { componentName: 'chefs-form-viewer' });
   */
  function createLogger(enabled) {
    const log = (level, msg, meta) => {
      if (!enabled) return;
      // eslint-disable-next-line no-console
      (console[level] || console.log)(`[${NAMESPACE}]`, msg, meta ?? '');
    };
    return {
      debug: (m, meta) => log('debug', m, meta),
      info: (m, meta) => log('info', m, meta),
      warn: (m, meta) => log('warn', m, meta),
      error: (m, meta) => log('error', m, meta),
    };
  }

  /**
   * Parses query parameters from the script src URL into a key-value object.
   * Handles URL parsing errors gracefully by returning empty object.
   *
   * @param {string} url - The script src URL containing query parameters
   * @returns {Object} Object with parameter names as keys and values as strings
   * @example
   * parseQueryParams('script.js?form-id=123&debug=true')
   * // Returns: { 'form-id': '123', debug: 'true' }
   */
  function parseQueryParams(url) {
    try {
      const urlObj = new URL(url);
      const params = {};
      for (const [key, value] of urlObj.searchParams) {
        params[key] = value;
      }
      return params;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        '[chefs-form-viewer-embed] Failed to parse URL:',
        err.message
      );
      return {};
    }
  }

  /**
   * Converts query parameter names to HTML attribute names.
   * Handles kebab-case conversion for multi-word attributes to ensure
   * proper web component attribute naming conventions.
   *
   * @param {string} param - The query parameter name (camelCase or snake_case)
   * @returns {string} Kebab-case attribute name suitable for HTML elements
   * @example
   * paramToAttribute('formId') // Returns: 'form-id'
   * paramToAttribute('read_only') // Returns: 'read-only'
   * paramToAttribute('api-key') // Returns: 'api-key' (already correct)
   */
  function paramToAttribute(param) {
    // Convert camelCase or snake_case to kebab-case
    return param
      .replaceAll(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
      .replaceAll('_', '-');
  }

  /**
   * Safely parse JSON strings from URL parameters
   */
  function parseJsonParam(value, paramName, logger) {
    if (!value) return null;
    try {
      return JSON.parse(decodeURIComponent(value));
    } catch (err) {
      logger.warn(`Invalid JSON in ${paramName} parameter:`, {
        value,
        error: err.message,
      });
      return null;
    }
  }

  /**
   * Dynamically loads the chefs-form-viewer component script if not already present.
   * Uses the embed script's URL to determine the component script location.
   * Waits for custom element definition to ensure component is ready for use.
   *
   * @param {HTMLScriptElement} script - The current embed script element
   * @param {Object} logger - Logger instance for debug output
   * @returns {Promise<void>} Resolves when component is loaded and defined
   * @throws {Error} If component script fails to load
   */
  async function loadComponent(script, logger) {
    if (customElements.get('chefs-form-viewer')) {
      return;
    }

    logger.info('Loading chefs-form-viewer component');
    const componentScript = document.createElement('script');
    const baseUrl = script.src.split('/chefs-form-viewer-embed.js')[0];
    componentScript.src = `${baseUrl}/chefs-form-viewer.js`;

    await new Promise((resolve, reject) => {
      componentScript.onload = resolve;
      componentScript.onerror = reject;
      document.head.appendChild(componentScript);
    });

    await customElements.whenDefined('chefs-form-viewer');
    logger.info('chefs-form-viewer component loaded');
  }

  /**
   * Determines if a parameter should be skipped during query parameter processing.
   * Skips debug parameter (handled separately) and api-key when auth-token is present.
   *
   * @param {string} param - Parameter name to check
   * @param {boolean} hasAuthToken - Whether auth-token is present
   * @returns {boolean} True if parameter should be skipped
   */
  function shouldSkipParam(param, hasAuthToken) {
    return param === 'api-key' && hasAuthToken;
  }

  /**
   * Applies URL query parameters to the chefs-form-viewer element.
   * Converts parameter names to proper attribute names and handles special
   * JSON parameters (token, user, headers) by setting them as element properties.
   *
   * @param {HTMLElement} element - The chefs-form-viewer element
   * @param {Object} params - Query parameters object from parseQueryParams
   * @param {Object} logger - Logger instance for debug output
   */
  function applyQueryParams(element, params, logger) {
    const booleanParams = new Set([
      'debug',
      'read-only',
      'isolate-styles',
      'no-icons',
      'auto-reload-on-submit',
    ]);
    const paramEntries = Object.entries(params);
    const hasAuthToken = paramEntries.some(
      ([param, value]) => param === 'auth-token' && value
    );

    function handleJsonParam(param, value) {
      const parsed = parseJsonParam(value, param, logger);
      if (parsed !== null) {
        element[param] = parsed;
      }
    }

    function handleBooleanParam(attrName, value) {
      if (parseBooleanParam(value)) {
        element.setAttribute(attrName, '');
      }
    }

    for (const [param, value] of paramEntries) {
      if (shouldSkipParam(param, hasAuthToken)) continue;

      const attrName = paramToAttribute(param);

      if (param === 'token' || param === 'user' || param === 'headers') {
        handleJsonParam(param, value);
      } else if (booleanParams.has(param)) {
        handleBooleanParam(attrName, value);
      } else {
        element.setAttribute(attrName, value);
      }
    }
  }

  /**
   * Apply global configuration if available
   */
  function applyGlobalConfig(element, params, logger) {
    if (!globalThis.ChefsViewerConfig) {
      return;
    }

    logger.info('Applying global ChefsViewerConfig');

    // Apply direct properties
    for (const [key, value] of Object.entries(globalThis.ChefsViewerConfig)) {
      if (typeof value !== 'function') {
        element[key] = value;
      }
    }

    // Call before hook
    if (typeof globalThis.ChefsViewerConfig.before === 'function') {
      try {
        globalThis.ChefsViewerConfig.before(element, params);
      } catch (err) {
        logger.error('Error in ChefsViewerConfig.before:', err);
      }
    }
  }

  /**
   * Call after hook if available
   */
  function callAfterHook(element, logger) {
    if (!globalThis.ChefsViewerConfig?.after) {
      return;
    }

    try {
      globalThis.ChefsViewerConfig.after(element, element.formioInstance);
    } catch (err) {
      logger.error('Error in ChefsViewerConfig.after:', err);
    }
  }

  /**
   * Show user-friendly error message
   */
  function showError(script, err, debug) {
    const ERROR_STYLES = {
      padding: '1rem',
      border: '1px solid #dc3545',
      background: '#f8d7da',
      color: '#721c24',
      borderRadius: '4px',
      fontFamily: 'sans-serif',
    };

    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = Object.entries(ERROR_STYLES)
      .map(
        ([key, value]) =>
          `${key.replaceAll(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`
      )
      .join('; ');
    errorDiv.innerHTML = `
      <strong>CHEFS Form Loading Error</strong><br>
      Unable to load the form. Please check your configuration.
      ${debug ? `<br><small>Error: ${err.message}</small>` : ''}
    `;

    if (script && script.parentNode) {
      script.parentNode.insertBefore(errorDiv, script);
      script.remove();
    } else {
      document.body.appendChild(errorDiv);
    }
  }

  /**
   * Main embedding function that orchestrates the entire embedding process.
   * This is the entry point that executes when the embed script loads.
   *
   * Algorithm:
   * 1. Discovers current script element in DOM
   * 2. Parses query parameters and sets up debug logging
   * 3. Loads component script dynamically if needed
   * 4. Creates and configures chefs-form-viewer element
   * 5. Sets up metadata extraction event listeners
   * 6. Replaces script tag with form element
   * 7. Initiates form loading and calls post-load hooks
   *
   * @returns {Promise<void>} Resolves when embedding is complete
   * @throws {Error} Shows user-friendly error if embedding fails
   */
  async function embedChefsFormViewer() {
    const script = document.currentScript;
    if (!script) {
      // eslint-disable-next-line no-console
      console.error(
        '[chefs-form-viewer-embed] Cannot find current script element'
      );
      return;
    }

    // Check for debug mode
    const params = parseQueryParams(script.src);
    const debug =
      parseBooleanParam(params.debug) ||
      globalThis.CHEFS_VIEWER_EMBED_DEBUG === true;
    const logger = createLogger(debug);

    logger.info('Initializing embed', { src: script.src });

    try {
      await loadComponent(script, logger);

      // Create the chefs-form-viewer element
      const element = document.createElement('chefs-form-viewer');

      applyQueryParams(element, params, logger);
      applyGlobalConfig(element, params, logger);

      // Listen for schema load to extract and expose metadata BEFORE loading
      element.addEventListener('formio:loadSchema', (e) => {
        const { form, schema } = e.detail;

        // Set element properties for easy access
        element.formName = form?.name || null;
        element.formDescription = form?.description || null;
        element.formMetadata = form || null;
        element.formSchema = schema || null;

        logger.info('Form metadata extracted', {
          name: element.formName,
          description: element.formDescription,
        });

        // Call metadata callback if available
        if (globalThis.ChefsViewerConfig?.onMetadataLoaded) {
          try {
            globalThis.ChefsViewerConfig.onMetadataLoaded({
              form,
              schema,
              formName: form?.name,
              formDescription: form?.description,
            });
          } catch (err) {
            logger.error('Error in ChefsViewerConfig.onMetadataLoaded:', err);
          }
        }

        // Emit enhanced event with metadata for easier access
        globalThis.dispatchEvent(
          new CustomEvent('chefs-form-viewer:metadata-loaded', {
            detail: {
              element,
              form,
              schema,
              formName: form?.name,
              formDescription: form?.description,
            },
            bubbles: true,
            composed: true,
          })
        );
      });

      // Insert element where script tag is located
      script.parentNode.insertBefore(element, script);
      script.remove();

      logger.info('Element created and inserted');

      // Auto-load the form
      await element.load();

      logger.info('Form loaded successfully');

      callAfterHook(element, logger);

      // Emit global event for external listeners
      globalThis.dispatchEvent(
        new CustomEvent('chefs-form-viewer:embedded', {
          detail: { element, params },
        })
      );
    } catch (err) {
      logger.error('Failed to embed chefs-form-viewer:', err);
      showError(script, err, debug);
    }
  }

  // Export utilities for testing (only in test environment)
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js/testing environment
    module.exports = {
      parseBooleanParam,
      parseQueryParams,
      parseJsonParam,
      paramToAttribute,
      createLogger,
      applyQueryParams,
    };
  } else if (
    typeof globalThis !== 'undefined' &&
    globalThis.__CHEFS_EMBED_TEST_MODE__
  ) {
    // Browser testing environment
    globalThis.__chefsEmbedUtils__ = {
      parseBooleanParam,
      parseQueryParams,
      parseJsonParam,
      paramToAttribute,
      createLogger,
      applyQueryParams,
    };
  }

  // Execute the embed function (only in production)
  if (typeof module === 'undefined' || !module.exports) {
    embedChefsFormViewer();
  }
})();
