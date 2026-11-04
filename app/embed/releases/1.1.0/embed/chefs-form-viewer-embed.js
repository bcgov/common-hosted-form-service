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
 * @example Release (integrity is the file's hash in the release's integrity.json)
 * <script
 *   src="https://chefs.example/app/embed/<version>/embed/chefs-form-viewer-embed.min.js?form-id=123&auth-token=..."
 *   integrity="sha384-..." crossorigin="anonymous"></script>
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
 *       
 *       // Set up user token refresh (for OIDC/OAuth tokens from host application)
 *       element.addEventListener('formio:userTokenExpiring', function(e) {
 *         // Refresh user token before it expires
 *         refreshUserAccessToken().then(function(newToken) {
 *           element.refreshUserToken({ token: newToken });
 *         });
 *       });
 *       
 *       // Initial user token setup
 *       element.refreshUserToken({ token: getCurrentUserToken() });
 *       
 *       // Set host application data for form logic
 *       element.setHostData({
 *         config: { maxItems: 10 },
 *         lookupData: { departments: ['IT', 'HR', 'Finance'] }
 *       });
 *       
 *       // Listen for host-controlled submissions (when submit-mode="host")
 *       element.addEventListener('formio:hostSubmit', async function(e) {
 *         const { data, isDraft } = e.detail;
 *         if (!isDraft) {
 *           // Handle final submission in host application
 *           await myApp.saveSubmission(data);
 *         }
 *       });
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
 * ## User Token Management
 *
 * The embed script supports managing user tokens (OIDC/OAuth) from the host application,
 * separate from the CHEFS API auth token. User tokens are passed via the Authorization header
 * in the headers parameter or updated programmatically.
 *
 * ### Method 1: Initial Setup via Headers Parameter
 * ```javascript
 * <script src="/app/embed/chefs-form-viewer-embed.js?form-id=123&auth-token=...&headers=%7B%22Authorization%22%3A%22Bearer%20user-token%22%7D"></script>
 * ```
 *
 * ### Method 2: Programmatic Refresh (Recommended)
 * ```javascript
 * const element = document.querySelector('chefs-form-viewer');
 * 
 * // Refresh user token when it expires
 * element.addEventListener('formio:userTokenExpiring', function(e) {
 *   refreshUserAccessToken().then(function(newToken) {
 *     element.refreshUserToken({ token: newToken });
 *   });
 * });
 *
 * // Initial token setup
 * element.refreshUserToken({ token: getCurrentUserToken() });
 * ```
 *
 * ### Method 3: Global Config Hook
 * ```javascript
 * globalThis.ChefsViewerConfig = {
 *   after: function(element, formioInstance) {
 *     // Set up user token refresh
 *     element.addEventListener('formio:userTokenExpiring', function(e) {
 *       refreshUserAccessToken().then(function(newToken) {
 *         element.refreshUserToken({ token: newToken });
 *       });
 *     });
 *     element.refreshUserToken({ token: getCurrentUserToken() });
 *   }
 * };
 * ```
 *
 * **Events:**
 * - `formio:userTokenRefreshed`: Fired when user token is updated via refreshUserToken()
 * - `formio:userTokenExpiring`: Fired when user token is about to expire (default 60s before expiry)
 * - `formio:hostSubmit`: Fired when submitMode is 'host' or 'none' after validation passes.
 *   Detail includes { data, submission, formId, formName, timestamp, isDraft }.
 *   Host can call event.preventDefault() to prevent auto read-only display (in 'host' mode).
 * - `formio:hostDataChanged`: Fired when host data is updated via setHostData()
 * - `formio:beforeSubmit`: Cancelable event fired before submission begins
 * - `formio:beforePrint`: Cancelable event fired before print/PDF generation
 * - `formio:printDone`: Fired after print/PDF generation completes
 * - `formio:beforeAutoReload`: Cancelable event fired before auto-reload after submission
 * - `formio:autoReload`: Fired when auto-reload begins
 * - `formio:autoReloadComplete`: Fired when auto-reload completes
 *
 * ## Supported Parameters
 *
 * All chefs-form-viewer attributes can be passed as URL query parameters:

 * **Required:**
 * - `form-id`: CHEFS form UUID
 * - `auth-token`: JWT authentication token (preferred)
 *   - The auth-token should be fetched by your backend server via POST /app/gateway/v1/auth/token/forms/<form-id> with required Authorization: Basic base64(formId:apiKey).
 *   - The backend should return the short-lived, refreshable token to the frontend for embedding and authenticating form access.
 * - `api-key`: API access key (fallback, only if auth-token is not available)
 * - Omit both for a Public form that lists this website in its allowed origins; the component
 *   then loads and submits it anonymously.

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
 *   The viewer keeps this button enabled when read-only so users can print submitted data.
 * - `token`: URL-encoded JSON JWT token object
 * - `user`: URL-encoded JSON user object
 * - `headers`: URL-encoded JSON headers object
 *   Contains headers available in Form.io's evalContext for custom JavaScript logic.
 *   The Authorization header can be updated programmatically via refreshUserToken() for user token management.
 *   Example: `headers=%7B%22Authorization%22%3A%22Bearer%20token%22%2C%22X-Custom%22%3A%22value%22%7D`
 * - `host-data`: URL-encoded JSON object containing arbitrary host application data
 *   Available in Form.io's evalContext as `host` for custom JavaScript logic, calculated values,
 *   conditional display, etc. Can also be updated programmatically via setHostData() after form loads.
 *   Example: `host-data=%7B%22config%22%3A%7B%22maxItems%22%3A10%7D%7D`
 * - `submit-mode`: Controls how form submission and draft saves are handled
 *   - "chefs" (default): Normal flow - submits/saves to CHEFS backend after validation.
 *   - "host": After validation, emits formio:hostSubmit event for host to handle data.
 *     For submissions: automatically displays read-only unless host calls preventDefault().
 *     For drafts: no auto read-only display (drafts are meant to be edited later).
 *   - "none": After validation, emits formio:hostSubmit but does NOT auto-display read-only.
 *     Host is fully responsible for what happens after (both submit and draft).
 * - `no-shadow`: Disable Shadow DOM rendering (true/false)
 *   When true, renders in light DOM mode. Styles are loaded into document.head and
 *   page/global CSS can affect the component (useful for integration and debugging).
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

  // A release build replaces these with its version and the SRI hashes of its files
  const RELEASE = {
    version: "1.1.0",
    integrity: {"assets/chefs-assets/BCSans-Bold-DLThXedW.woff":"sha384-ih9r0htFmEVdgplhtPw7f3NWCMLZHGLWlmw54IkPAQBGlB2pk14C1RxSp6X00fdD","assets/chefs-assets/BCSans-BoldItalic-B1wzMjUl.woff":"sha384-SIeYJ8TWWDa7ZD64O0Ph+/d2BaQd1kx5kKWI13CbjSVx7Uze5mUROaA0kqIv1sO/","assets/chefs-assets/BCSans-Italic-DrCEB72l.woff":"sha384-bflnuBtmq1So+gLrt3QPy9EEfTqrO52JilXaLKwsSNA+q6wq1IzkvCOHhly6kPZJ","assets/chefs-assets/BCSans-Regular-D1GWWdtt.woff":"sha384-NRrmKGdKwvU/wJATNxFSFacIWPO8mCCGzAvlh88hzm8jOWBrc/nfHBj73NHfGCoC","assets/chefs-assets/fontawesome-webfont-B-jkhYfk.woff2":"sha384-wmfasCsFE3p9BgQSCciiJ0R6GvOSsKKZJMXBvTiCuWa3ypa5yXGVjSdzuU/ON6P6","assets/chefs-assets/fontawesome-webfont-CDK5bt4p.woff":"sha384-miAIzLueFC2a1i22Q520oFQwc/N2wtaYe93QyrKYlj5f0T0+DkQEpMs7S+MvkTW/","assets/chefs-assets/fontawesome-webfont-CQDK8MU3.ttf":"sha384-arWNUkFcwgK/p/bP6IcquY+ZOXqnmOVkdFBJpkkKX7ldohEAUno5hxI+lm4tn4Cm","assets/chefs-assets/fontawesome-webfont-D13rzr4g.svg":"sha384-cpmd2Pb8rcQw0Rb0JqVxqpRf1aPgEYmq/SvC4aU562SjUEQ+KClejtxnrYLwTOI1","assets/chefs-assets/fontawesome-webfont-G5YE5S7X.eot":"sha384-aT4Js4F9nY6/YfdaUe74bgxzlDR1S188jXIJZQj981StDN6YfBNOetz0JVYt8RRs","assets/chefs-assets/materialdesignicons-webfont-BqTIB9TP.woff":"sha384-9c1lS//yTZYWDba5zEWBLRm2Zacyrr1Pxp/3gc1UgYjZZlDS9V+ts9PF29NA7TqB","assets/chefs-assets/materialdesignicons-webfont-Cd51xsCA.eot":"sha384-6nHfAciRMC2Pbr0xW37OsWd+tTaBF1wTyixV+M1l1HeWcxNnUcl1iNoZtHXtfJXJ","assets/chefs-assets/materialdesignicons-webfont-CfT4HAkQ.ttf":"sha384-qgnDRGn6Nd+onFtmm/UDDP3DAZc/vw8+q8DGV/OkK8ntih/SSDtE+j1rlf+GEv/v","assets/chefs-assets/materialdesignicons-webfont-DsMmahHu.woff2":"sha384-hab/fTqDGJJxJXnedb0ev1oqBm3dqUWM/VFdtawJhPPaxR5hyIZkrENjky+SHTi1","assets/chefs-assets/spritesheet-DpIxuf5L.svg":"sha384-vGiUBPgTxbQczYLBJbzC4xOzcKkNU1zVxPiHGgLZeBkHcNIvicMV3hGb2vqeZgbG","assets/chefs-index.css":"sha384-8CUcG/7ak0GBNHAA7RdFdYV3+GwVVhBprevMG6X7IwAPZTZMsYOfz97+xzbUqWAj","assets/chefs-theme.css":"sha384-vqYQKOrSAjLJSyytcA9px3NI5eP3xbkc1uMd67V1Ve8y9hg2FnoVoRc//KIuWR5Q","assets/font-awesome/css/font-awesome.min.css":"sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN","assets/font-awesome/fonts/FontAwesome.otf":"sha384-7AxH7c5DMKm53fxbc2HaPopOPZBE7W43HdFmP2Itt4aQS9DDq9rkE0IzE2ldLvmw","assets/font-awesome/fonts/fontawesome-webfont.eot":"sha384-aT4Js4F9nY6/YfdaUe74bgxzlDR1S188jXIJZQj981StDN6YfBNOetz0JVYt8RRs","assets/font-awesome/fonts/fontawesome-webfont.svg":"sha384-cpmd2Pb8rcQw0Rb0JqVxqpRf1aPgEYmq/SvC4aU562SjUEQ+KClejtxnrYLwTOI1","assets/font-awesome/fonts/fontawesome-webfont.ttf":"sha384-arWNUkFcwgK/p/bP6IcquY+ZOXqnmOVkdFBJpkkKX7ldohEAUno5hxI+lm4tn4Cm","assets/font-awesome/fonts/fontawesome-webfont.woff":"sha384-miAIzLueFC2a1i22Q520oFQwc/N2wtaYe93QyrKYlj5f0T0+DkQEpMs7S+MvkTW/","assets/font-awesome/fonts/fontawesome-webfont.woff2":"sha384-wmfasCsFE3p9BgQSCciiJ0R6GvOSsKKZJMXBvTiCuWa3ypa5yXGVjSdzuU/ON6P6","assets/formio.full.min.css":"sha384-O6N1enHf71tFCIQWqakjm395eSXP4Gi+TFRJuexVq8a3qfaNEqP86jMXh/eLqFWy","assets/formio.full.min.js":"sha384-JOWjofNsn1acCuE8yE++ek6E2F0fdWpl/hKvZKobve2FcmEsIHLMcE8KDKWHrSIk","assets/formio.full.min.js.LICENSE.txt":"sha384-bThh7tzH/BqB7nEE3tsUvyP3KPxmjLC4bsTrPyEQgAoL4hPW2vrn3Xi0LqkSds8n","embed/chefs-form-viewer-override-template.css":"sha384-rBP6z3/NKUynFz75+Fv/Nz88Zz+zW8/qVkXjpu5+KiiLXT7b2FVNusttKSJ8hw52","embed/chefs-form-viewer-theme-dark.css":"sha384-yAgIv6yrpi1Ps+4XEILz7hZ2GFwH27fDT8FPT7GJx219oKxPJn+erQKnFNCmsjjl","embed/chefs-form-viewer-theme-material.css":"sha384-YIBIXujy0Rv0HEnBl2vEHaHmjj7gREyQt0FsctIbhKvQJXkI2LWbXsYVJCmE7U5Z","embed/chefs-form-viewer.js":"sha384-YyCrMCg0HW9/z5UWUxLniHAoyVXDEvxvpMlninHuO1m/+D6Vh78mBtLU3P55jTV+","embed/chefs-form-viewer.min.js":"sha384-Zz9bmBPxz2kLWrUMwBzY3L8+jmwV+e3XNKyLEkVuG6+esMd270diV4/7zcTooEmk","embed/chefs-form-viewer.min.js.map":"sha384-1hhsV5sEnioWt3Gvd31v6pOtXyTchOsyQUhpY507Gk5a13xuW29TiVxV6CHw15qB","form-viewer/bcgov-formio-components.use.min.js":"sha384-VQXSwSa9VeRvXaKHwxAio2VPVi+Ee5xSsPJfGkLr6PGF0621fcaCPED/qwpS0P5s","form-viewer/bcgov-formio-components.use.min.js.LICENSE.txt":"sha384-PMbNtKsWRByTQWUw98m6q1NOaOp6lYr1InWRgXn4Y8t9BuaVsuMMhe0+DBLr2caY","form-viewer/bcgov-theme.css":"sha384-DT4JnPa1B3kN+8uaXNVsuKqTe/MyXEOF7faBnxPv8Pt5nwXotd64omwC4zHrI9+/","form-viewer/chefs-form-viewer.css":"sha384-nQ8QHbmapCQSkwU0Ly/U65bqCp/XH1SUew+Q7UsqBZaKiumLixRwzI7OKIZMpFNv"},
  };

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
   * Finds the component script next to the embed script. A release loads its
   * minified component and checks it against the release's SRI hash.
   *
   * @param {string} scriptSrc - The embed script's URL, with or without .min and query parameters
   * @param {Object} release - Release version and SRI hashes
   * @returns {Object} { src, integrity } where integrity is null outside a release
   * @example
   * componentScript('https://host/app/embed/1.0.0/embed/chefs-form-viewer-embed.min.js?form-id=1', release)
   * // Returns: { src: 'https://host/app/embed/1.0.0/embed/chefs-form-viewer.min.js', integrity: 'sha384-...' }
   */
  function componentScript(scriptSrc, release = RELEASE) {
    const file = release.version
      ? 'chefs-form-viewer.min.js'
      : 'chefs-form-viewer.js';
    return {
      src: new URL(file, scriptSrc).href,
      integrity: release.integrity[`embed/${file}`] || null,
    };
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
    const componentScriptElement = document.createElement('script');
    const { src, integrity } = componentScript(script.src);
    componentScriptElement.src = src;
    if (integrity) {
      componentScriptElement.integrity = integrity;
      componentScriptElement.crossOrigin = 'anonymous';
    }

    await new Promise((resolve, reject) => {
      componentScriptElement.onload = resolve;
      componentScriptElement.onerror = reject;
      document.head.appendChild(componentScriptElement);
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
   * JSON parameters (token, user, headers, host-data) by setting them as element properties.
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
      'no-shadow',
    ]);
    const paramEntries = Object.entries(params);
    const hasAuthToken = paramEntries.some(
      ([param, value]) => param === 'auth-token' && value
    );

    function handleBooleanParam(attrName, value) {
      if (parseBooleanParam(value)) {
        element.setAttribute(attrName, '');
      } else if (attrName !== 'no-shadow') {
        // The component reads these values, so "false" can turn off auto-reload-on-submit.
        // no-shadow is read by presence, so a false value leaves it unset.
        element.setAttribute(attrName, 'false');
      }
    }

    for (const [param, value] of paramEntries) {
      if (shouldSkipParam(param, hasAuthToken)) continue;

      const attrName = paramToAttribute(param);

      if (
        param === 'token' ||
        param === 'user' ||
        param === 'headers' ||
        param === 'host-data'
      ) {
        // host-data needs to be set as hostData property (camelCase)
        const propName = param === 'host-data' ? 'hostData' : param;
        const parsed = parseJsonParam(value, param, logger);
        if (parsed !== null) {
          element[propName] = parsed;
        }
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
      componentScript,
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
      componentScript,
    };
  }

  // Execute the embed function (only in production)
  if (typeof module === 'undefined' || !module.exports) {
    embedChefsFormViewer();
  }
})();
