// chefs-form-viewer.js
(() => {
  'use strict';

  const NAMESPACE = 'chefs-form-viewer';
  const bool = (v) =>
    v === true || v === 'true' || v === '' || v === 1 || v === '1';

  /**
   * Creates a minimal redaction-aware logger for the component.
   *
   * @param {boolean} enabled - Whether logging is enabled
   * @returns {Object} Logger object with debug, info, warn, error methods
   *
   * **Enabling:**
   * - Set the custom element attribute `debug` (e.g., `<chefs-form-viewer debug ...>`) OR
   * - Set `globalThis.CHEFS_VIEWER_DEBUG = true` before the element is connected.
   *
   * **Behavior:**
   * - When not enabled, all log calls are effectively no-ops (guarded in the internal `log()` helper).
   * - Usage: `this._log.debug(...)`, `this._log.info(...)`, `this._log.warn(...)`, `this._log.error(...)`.
   *
   * @example
   * const logger = createLogger(true);
   * logger.info('Form loaded', { formId: '123' });
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
   * Pure utility functions for easier testing
   *
   * These functions have no side effects and can be easily unit tested.
   * They handle data transformation, validation, and computation logic
   * without touching DOM, network, or global state.
   */
  const FormViewerUtils = {
    /**
     * Validates asset URL for scripts and stylesheets
     * Throws an error if invalid
     * @param {string} url - The asset URL
     * @param {string} type - 'js' or 'css'
     */
    validateAssetUrl(url, type) {
      if (!url || typeof url !== 'string' || !/^https?:\/\//.test(url)) {
        throw new Error(
          `Malformed or missing ${type.toUpperCase()} URL: ${url}`
        );
      }
    },
    /**
     * Parses base URL from window location
     * @param {Object} location - globalThis.location-like object
     * @returns {string} Base URL
     */
    parseBaseUrl(location) {
      const origin =
        location && typeof location.origin === 'string'
          ? location.origin
          : 'undefined';
      let pathname =
        location && typeof location.pathname === 'string'
          ? location.pathname
          : '';
      const match = pathname.match(/^\/(app|pr-\d+)\b/);
      const baseSegment = match ? `/${match[1]}` : '/app';
      return `${origin}${baseSegment}`;
    },
    /**
     * Creates Basic auth header
     * @param {string} formId - Form identifier
     * @param {string} apiKey - API key
     * @returns {Object} Auth header object
     */
    createBasicAuthHeader(username, password, encoder = globalThis.btoa) {
      if (
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        !username ||
        !password
      )
        return {};
      const creds = encoder(`${username}:${password}`);
      return {
        Authorization: `Basic ${creds}`,
      };
    },

    /**
     * Safely parses JSON with error handling
     * @param {string} value - JSON string to parse
     * @param {string} context - Context for error logging
     * @returns {Object} { success: boolean, data: any, error: string|null }
     */
    safeJsonParse(str, context = '') {
      if (typeof str !== 'string') {
        return {
          success: false,
          data: null,
          error: `Invalid JSON in ${context}: Not a string`,
        };
      }
      if (!str.trim()) {
        // treat empty/whitespace as valid empty JSON
        return { success: true, data: null, error: null };
      }
      try {
        return { success: true, data: JSON.parse(str), error: null };
      } catch (e) {
        return {
          success: false,
          data: null,
          error: `Invalid JSON in ${context}: ${e.message}`,
        };
      }
    },

    /**
     * Extracts submission data from CHEFS response format
     * @param {Object} json - Response JSON
     * @returns {Object} { data: Object|null }
     */
    parseSubmissionData(obj) {
      // Top-level must be a non-null object, not array
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        throw new Error(
          'Submission payload must be a non-null object, not array'
        );
      }
      // If obj.submission exists, it must be an object
      if ('submission' in obj) {
        if (
          !obj.submission ||
          typeof obj.submission !== 'object' ||
          Array.isArray(obj.submission)
        ) {
          throw new Error(
            'submission property must be a non-null object, not array'
          );
        }
        // If obj.submission.submission exists, it must be an object
        if ('submission' in obj.submission) {
          if (
            !obj.submission.submission ||
            typeof obj.submission.submission !== 'object' ||
            Array.isArray(obj.submission.submission)
          ) {
            throw new Error(
              'submission.submission property must be a non-null object, not array'
            );
          }
          // Return data from nested submission
          return {
            data: obj.submission.submission.data || obj.submission.submission,
          };
        }
        // Return data from submission
        return { data: obj.submission.data || obj.submission };
      }
      // If obj.data exists, it must be an object
      if ('data' in obj) {
        if (
          !obj.data ||
          typeof obj.data !== 'object' ||
          Array.isArray(obj.data)
        ) {
          throw new Error('data property must be a non-null object, not array');
        }
        return { data: obj.data };
      }
      // If no valid data found, throw
      throw new Error('No valid submission data found in payload');
    },

    /**
     * Validates and parses schema payload from backend
     * Throws error if shape is invalid
     * @param {Object} payload - Backend response JSON
     * @returns {Object} { form, schema }
     */
    parseSchemaPayload(payload) {
      if (!payload || typeof payload !== 'object') {
        throw new Error('Schema payload is not an object');
      }
      // Require payload.form to be an object
      const form = payload.form;
      if (!form || typeof form !== 'object' || Array.isArray(form)) {
        throw new Error('form property must be a non-null object');
      }
      // Require schema to be an object, from payload.schema or payload.form.versions[0].schema
      let schema = null;
      if (
        payload.schema &&
        typeof payload.schema === 'object' &&
        !Array.isArray(payload.schema)
      ) {
        schema = payload.schema;
      } else if (
        form.versions &&
        Array.isArray(form.versions) &&
        form.versions[0] &&
        form.versions[0].schema &&
        typeof form.versions[0].schema === 'object' &&
        !Array.isArray(form.versions[0].schema)
      ) {
        schema = form.versions[0].schema;
      }
      if (!schema) {
        throw new Error('schema property missing or invalid');
      }
      return { form, schema };
    },

    /**
     * Validates Form.io global availability
     * @param {Object} windowObj - window-like object
     * @returns {Object} { available: boolean, hasCreateForm: boolean }
     */
    validateFormioGlobal(windowObj) {
      const formio = windowObj?.Formio;
      return {
        available: !!formio,
        hasCreateForm: typeof formio?.createForm === 'function',
      };
    },

    /**
     * Generates CSS for Font Awesome font faces
     * @param {string} baseUrl - Base URL for font assets
     * @returns {string} CSS string
     */
    generateFontFaceCSS(baseUrl) {
      const fontPath = `${baseUrl}/webcomponents/v1/assets/font-awesome/fonts`;
      return `@font-face{font-family:'FontAwesome';src:url('${fontPath}/fontawesome-webfont.eot?v=4.7.0');src:url('${fontPath}/fontawesome-webfont.eot?#iefix&v=4.7.0') format('embedded-opentype'),url('${fontPath}/fontawesome-webfont.woff2?v=4.7.0') format('woff2'),url('${fontPath}/fontawesome-webfont.woff?v=4.7.0') format('woff'),url('${fontPath}/fontawesome-webfont.ttf?v=4.7.0') format('truetype'),url('${fontPath}/fontawesome-webfont.svg?v=4.7.0#fontawesomeregular') format('svg');font-weight:normal;font-style:normal;font-display:swap;}`;
    },

    /**
     * Generates CSS for icon color inheritance
     * @returns {string} CSS string
     */
    generateIconColorCSS() {
      return `.formio-form .btn .fa,.formio-form .btn [class*="fa-"]{color:currentColor!important;-webkit-text-fill-color:currentColor!important;}`;
    },

    /**
     * Generates CSS for icon neutralization
     * @returns {string} CSS string
     */
    generateIconNeutralizeCSS() {
      return `.formio-form .fa,.formio-form [class*="fa-"]{font-family:inherit!important;}.formio-form .fa::before,.formio-form [class*="fa-"]::before{content:''!important;}`;
    },

    /**
     * Merges data objects for prefill application
     * @param {Object} existingData - Current form data
     * @param {Object} prefillData - Data to merge in
     * @returns {Object} Merged data object
     */
    mergePrefillData(existingData = {}, prefillData = {}) {
      return { ...existingData, ...prefillData };
    },

    /**
     * Checks if prefill data was successfully applied
     * @param {Object} currentData - Current form data
     * @param {Object} expectedData - Expected prefill data
     * @returns {boolean} True if data appears to be applied
     */
    isPrefillDataApplied(currentData, expectedData) {
      if (
        !currentData ||
        typeof currentData !== 'object' ||
        !expectedData ||
        typeof expectedData !== 'object'
      )
        return false;
      return Object.keys(expectedData).some(
        (key) => currentData[key] === expectedData[key]
      );
    },

    /**
     * Resolves a URL with endpoint overrides and parameter substitution
     * @param {Object} endpoints - All available endpoints
     * @param {string} endpointKey - Key to resolve
     * @param {Object} params - Parameters for substitution (formId, submissionId)
     * @param {Object} overrides - Endpoint overrides (optional)
     * @returns {string} Resolved URL
     */
    resolveUrl(endpoints, endpointKey, params = {}, overrides = {}) {
      const defaultUrl = endpoints[endpointKey];
      const overrideUrl = overrides[endpointKey];
      const baseUrl = overrideUrl || defaultUrl;

      if (!baseUrl) {
        throw new Error(`Unknown endpoint: ${endpointKey}`);
      }

      return this.substituteUrlParams(baseUrl, params);
    },

    /**
     * Resolves URL with fallback support
     * @param {Object} endpoints - All available endpoints
     * @param {string} primaryKey - Primary endpoint key
     * @param {string} fallbackKey - Fallback endpoint key
     * @param {Object} params - Parameters for substitution
     * @param {Object} overrides - Endpoint overrides (optional)
     * @returns {Object} { primary: string, fallback: string|null }
     */
    resolveUrlWithFallback(
      endpoints,
      primaryKey,
      fallbackKey,
      params = {},
      overrides = {}
    ) {
      const primary = this.resolveUrl(endpoints, primaryKey, params, overrides);
      const fallback = fallbackKey
        ? this.resolveUrl(endpoints, fallbackKey, params, overrides)
        : null;
      return { primary, fallback };
    },

    /**
     * Substitutes URL parameters
     * @param {string} url - URL template
     * @param {Object} params - Parameters to substitute
     * @returns {string} URL with parameters substituted
     */
    substituteUrlParams(url, params = {}) {
      let result = url;

      // Handle :paramName and /:paramName patterns
      for (const [key, value] of Object.entries(params)) {
        if (value != null) {
          result = result
            .replaceAll(new RegExp(`/:${key}\\b`, 'g'), `/${value}`)
            .replaceAll(new RegExp(`:${key}\\b`, 'g'), value);
        }
      }

      return result;
    },

    /**
     * Creates DOM elements with attributes
     * @param {string} tagName - HTML tag name
     * @param {Object} attributes - Key-value pairs of attributes
     * @param {string} textContent - Text content (optional)
     * @returns {HTMLElement} Created element
     */
    createElement(tagName, attrs = {}, text = '') {
      if (typeof tagName !== 'string' || !tagName) {
        throw new DOMException('Invalid tagName');
      }
      const el = document.createElement(tagName);
      for (const [k, v] of Object.entries(attrs)) {
        el.setAttribute(k, v);
      }
      if (text) el.textContent = text;
      return el;
    },

    /**
     * Safely appends element to parent, handling Shadow DOM vs Light DOM
     * @param {HTMLElement} element - Element to append
     * @param {HTMLElement|ShadowRoot} parent - Parent to append to
     * @param {HTMLElement} fallbackParent - Fallback parent (e.g., document.head)
     */
    appendElement(element, parent, fallbackParent = null) {
      if (parent) {
        parent.appendChild(element);
      } else if (fallbackParent) {
        fallbackParent.appendChild(element);
      }
    },

    /**
     * Creates and appends a style element with CSS
     * @param {string} css - CSS content
     * @param {HTMLElement|ShadowRoot} parent - Where to append the style
     * @param {string} id - Optional ID for the style element
     * @returns {HTMLElement} The created style element
     */
    injectStyle(css, parent, id = null) {
      // Check if style with ID already exists
      if (
        id &&
        parent &&
        parent.querySelector &&
        parent.querySelector(`#${id}`)
      ) {
        return null;
      }
      const style = document.createElement('style');
      if (id) style.id = id;
      style.textContent = css;
      if (parent && parent.appendChild) parent.appendChild(style);
      return style;
    },

    /**
     * Validates if a global object has required methods
     * @param {Object} globalObj - Global object to validate
     * @param {string} property - Property name to check
     * @param {Array<string>} methods - Method names that should exist
     * @returns {boolean} True if all methods exist
     */
    validateGlobalMethods(globalObj, property, methods = []) {
      const target = globalObj?.[property];
      if (!target) return false;

      return methods.every((method) => typeof target[method] === 'function');
    },

    /**
     * Decodes a JWT and returns the exp (expiration time) claim as a Unix timestamp (seconds).
     * Returns null if token is invalid or exp is missing.
     * @param {string} token - JWT string
     * @returns {number|null} Expiry timestamp in seconds, or null if not found/invalid
     */
    getJwtExpiry(token) {
      if (!token || typeof token !== 'string') return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      try {
        // Decode base64url
        let base64 = parts[1].replaceAll('-', '+').replaceAll('_', '/');
        while (base64.length % 4) base64 += '=';
        const json = atob(base64);
        const payload = JSON.parse(json);
        return typeof payload.exp === 'number' ? payload.exp : null;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`[${NAMESPACE}] Error decoding JWT:`, e);
        return null;
      }
    },

    /**
     * Returns the number of seconds until expiry for a JWT token.
     * Returns null if token is invalid or exp is missing.
     * @param {string} token - JWT string
     * @returns {number|null} Seconds until expiry, or null if not found/invalid
     */
    secondsUntilExpiry(token) {
      const exp = this.getJwtExpiry(token);
      if (!exp) return null;
      return exp - Math.floor(Date.now() / 1000);
    },
  };

  globalThis.FormViewerUtils = FormViewerUtils;

  /**
   * CHEFS Form Viewer Web Component
   *
   * A custom HTML element that renders CHEFS forms using Form.io with a clean,
   * event-driven API. Provides Shadow DOM isolation, CHEFS-specific defaults,
   * and comprehensive configuration options.
   *
   * @class ChefsFormViewer
   * @extends HTMLElement
   * @since 1.5.0
   *
   * Element name
   * - <chefs-form-viewer>
   *
   * Quick embed (HTML)
   * - Add the script to your page, then place the element and call load():
   *   <chefs-form-viewer
   *     form-id="YOUR_FORM_ID"
   *     auth-token="YOUR_JWT_TOKEN"
   *     language="en"
   *     token='{"sub":"user123","roles":["admin"]}'
   *     user='{"name":"John Doe","email":"john@example.com"}'
   *     read-only
   *     isolate-styles
   *     debug
   *   ></chefs-form-viewer>
   *   <script>
   *     const el = document.querySelector('chefs-form-viewer');
   *     el.load();
   *   </script>
   *
   * Configuration via attributes
   * - form-id (string): required. The CHEFS/Form.io form identifier.
   * - auth-token (string): JWT authentication token (preferred).
   *   - The auth-token should be fetched by your backend server using the protected api-key and form-id via POST /app/gateway/v1/auth/token/forms/<form-id>.
   *   - The backend should return the short-lived, refreshable token to the frontend for embedding and authenticating form access.
   *   - Enables automatic token refresh based on expiry time. Refreshed 60 seconds before expiry.
   * - api-key (string): API access key (fallback, only if auth-token is not available).
   *   - Used with form-id for same-origin Basic auth when auth-token is not available.
   * - submission-id (string): optional. Prefills from an existing submission.
   * - read-only (boolean): when present/"true"/empty/1 enables read-only.
   * - language (string): i18n language code (default: "en").
   * - base-url (string): override autodetected base (defaults to /app or /pr-####).
   * - debug (boolean): enable console logging.
   * - no-shadow (boolean): render in light DOM instead of Shadow DOM.
   * - submit-button-key (string): key used for submit vs draft flag (default: "submit").
   * - theme-css (string): URL of a theme stylesheet loaded after base styles.
   * - isolate-styles (boolean): minimize inherited page styles inside Shadow DOM.
   * - no-icons (boolean): do not load Font Awesome (icons will not render).
   * - token (string): JSON string containing token object for Form.io evalContext.
   * - user (string): JSON string containing user object for Form.io evalContext.
   *
   * Notes on boolean attributes
   * - Standard HTML boolean semantics apply: presence, "true", empty string, "1" are treated as true.
   *
   * Programmatic configuration
   * - Properties can be set directly prior to calling load():
   *   const el = document.querySelector('chefs-form-viewer');
   *   el.formId = '...';
   *   el.authToken = '...';
   *   el.token = { sub: 'user123', roles: ['admin'] };
   *   el.user = { name: 'John Doe', email: 'john@example.com' };
   *   el.endpoints = { themeCss: 'https://example.com/theme.css' };
   *   el.load();
   *
   * Overriding endpoints
   * - Set el.endpoints = { mainCss, formioJs, componentsJs, themeCss, schema, submit, readSubmission, iconsCss }
   *
   * Core events (CustomEvent)
   * - formio:ready, formio:render, formio:change, formio:submit, formio:submitDone, formio:error
   * - formio:authTokenRefreshed: fired when auth token is refreshed (includes new and old tokens)
   *
   * Lifecycle overview
   * 1) connectedCallback
   *    - Initialize logger (attribute or window flag)
   *    - Select render root (Shadow DOM by default; light DOM if `no-shadow`)
   *    - Render shell (container only). Does not auto-load
   * 2) load()
   *    - Guard against concurrent loads; emit `formio:beforeLoad` (cancelable)
   *    - _loadSchema() fetches and parses schema via `parsers.schema`
   *    - _initFormio()
   *       a) _ensureAssets() state machine: HINTS → CSS → JS → FONTS → READY
   *       b) _registerAuthPlugin() with dynamic header resolution
   *       c) _initAuthTokenRefresh() to set up automatic token refresh cycle
   *       d) _loadPrefillData() (parallel with setup)
   *       e) Build Form.io options (readOnly, language, hooks)
   *       f) Emit `formio:beforeInit` (cancelable with waitUntil)
   *       g) Create Form.io instance; _configureInstanceEndpoints()
   *       h) _applyPrefill() with single, robust strategy
   *       i) _wireInstanceEvents(); log `ready`
   *    - Emit `formio:ready`
   * 3) submit()/draft()
   *    - _programmaticSubmit(true|false) sets submitKey and calls _manualSubmit()
   *    - _manualSubmit() emits `formio:beforeSubmit` (waitUntil), POSTs to backend, emits `formio:submitDone` or `formio:error`
   * 4) reload()
   *    - destroy() → load()
   * 5) disconnectedCallback
   *    - destroy()
   *
   * Attribute effects during lifecycle
   * - `no-shadow`: switches render root and re-renders shell; styles load into document.head
   * - `isolate-styles`: when in Shadow DOM, applies minimal isolation CSS and re-renders shell
   */
  /**
   * Headers that cannot be overridden by passthrough headers from host applications.
   * These headers are controlled by CHEFS and must not be modified.
   */
  const BLOCKED_PASSTHROUGH_HEADERS = [
    'x-chefs-gateway-token', // CHEFS authentication header
    'x-request-id', // Correlation ID (cls-rtracer)
    'x-powered-by', // Express header
  ];

  class ChefsFormViewer extends HTMLElement {
    static get observedAttributes() {
      return [
        'form-id',
        'auth-token',
        'api-key',
        'submission-id',
        'read-only',
        'language',
        'base-url',
        'debug',
        'no-shadow',
        'submit-button-key',
        'theme-css',
        'isolate-styles',
        'no-icons',
        'token',
        'user',
        'auto-reload-on-submit',
      ];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });

      // State
      this.formId = null;
      this.authToken = null;
      this.apiKey = null;
      this.submissionId = null;
      this.readOnly = false;
      this.language = 'en';
      this.form = {};
      this.formSchema = {};
      this.formioInstance = null;
      this._root = this.shadowRoot;
      this._log = createLogger(false);
      this._isBusy = false; // shared lock for load/submit/draft
      this.submitButtonKey = 'submit';
      this.themeCss = null; // optional theme CSS loaded after main CSS
      this.isolateStyles = false; // optional isolation of inherited outside styles
      this.noIcons = false; // optional flag to disable loading icon CSS
      this.token = null; // optional token object for Form.io evalContext
      this.user = null; // optional user object for Form.io evalContext
      this._prefillData = null; // cached prefill data for submission
      this.autoReloadOnSubmit = true; // auto-reload form as read-only after successful submission

      // Asset loading state machine
      this._assetState = 'IDLE';
      this._assetErrors = [];
      this._loadedAssets = new Map();

      // Endpoint overrides via property
      // object is { mainCss, formioJs, componentsJs, themeCss, schema, submit, readSubmission, iconsCss }
      this.endpoints = null;

      // Optional: custom auth header hook
      this.onBuildAuthHeader = null; // (url) => ({ 'X-Chefs-Gateway-Token': '...' })
      this.onPassthroughHeaders = null; // (url) => ({ 'Authorization': 'Bearer ...', 'X-Custom': '...' })

      // if using authToken, then we can set an auto-refresh
      this._jwtRefreshTimer = null;

      // Track auth plugin registration to avoid re-registration
      this._authPluginRegistered = false;

      // simplefile component download file holder
      this.downloadFile = {
        data: null,
        headers: null,
      };

      /**
       * Overrideable parsers for backend payloads (CHEFS-compatible defaults)
       * ...existing code...
       */
      this.parsers = {
        schema: (json) => this._verifyAndParseSchema(json),
        readSubmission: (json) => this._verifyAndParseSubmissionData(json),
        submitResult: (json) => ({ submission: json }),
        error: (json) => json?.detail || json?.message || null,
      };
    }

    /**
     * Reflect attribute changes into internal state
     *
     * Attributes and effects
     * - form-id: string; the form identifier to load.
     * - auth-token: string; JWT authentication token from CHEFS for this form-id. Preferred over api-key.
     *   When set, enables automatic token refresh based on expiry time and dynamic authentication
     *   for all same-origin requests. The token is refreshed 60 seconds before expiry.
     * - api-key: string; pairs with form-id to generate Basic auth for same-origin requests.
     * - submission-id: string; when set, the component will prefetch and apply submission data.
     * - read-only: boolean; passes readOnly to Form.io to disable editing.
     * - language: string; i18n language code (default "en").
     * - base-url: string; overrides autodetected base (e.g., https://myhost.com/app or https://myhost.com  /pr-####).
     * - debug: boolean; enables the internal logger (also via globalThis.CHEFS_VIEWER_DEBUG).
     * - no-shadow: boolean; when present, disables Shadow DOM rendering by switching the render root to the
     *   host element and re-rendering the shell. In this mode, styles are loaded into document.head and
     *   page/global CSS can affect the component (useful for integration and debugging).
     * - submit-button-key: string; the data key used to distinguish submit vs draft (default: "submit") Name/APiKey of formio Submit Button.
     * - theme-css: string; URL of theme stylesheet to load after base styles.
     * - isolate-styles: boolean; when true and using Shadow DOM, applies minimal isolation CSS to reduce
     *   inheritance from the host page (via :host { all: initial } and a normalized container). Triggers
     *   a shell re-render so the isolation rules take effect. In light DOM (no-shadow), strict isolation
     *   is not applied; the attribute is effectively a no-op for isolation in that mode.
     * - no-icons: boolean; when true, skips loading Font Awesome. Form.io icon classes will not render.
     * - token: string; JSON string containing a token object that will be available in Form.io's evalContext
     *   for use in custom JavaScript logic, conditional display, calculated values, etc. Must be valid JSON.
     * - user: string; JSON string containing a user object that will be available in Form.io's evalContext
     *   for use in custom JavaScript logic, conditional display, calculated values, etc. Must be valid JSON.
     * - auto-reload-on-submit: boolean; when true (default), automatically reloads the form as read-only
     *   after successful submission, showing the submitted data. This provides a CHEFS-like experience
     *   out-of-the-box. Set to "false" to disable this behavior.
     */
    attributeChangedCallback(name, _ov, nv) {
      switch (name) {
        case 'form-id':
          this.formId = nv;
          break;
        case 'auth-token':
          this.authToken = nv;
          break;
        case 'api-key':
          this.apiKey = nv;
          break;
        case 'submission-id':
          this.submissionId = nv;
          break;
        case 'read-only':
          this.readOnly = bool(nv);
          break;
        case 'language':
          this.language = nv || 'en';
          break;
        case 'base-url':
          this.baseUrl = nv || null;
          break;
        case 'debug':
          this._log = createLogger(bool(nv));
          break;
        case 'no-shadow':
          this._root = this.hasAttribute('no-shadow') ? this : this.shadowRoot;
          this.render();
          break;
        case 'submit-button-key':
          this.submitButtonKey = nv || 'submit';
          break;
        case 'theme-css':
          this.themeCss = nv || null;
          break;
        case 'isolate-styles':
          this.isolateStyles = bool(nv);
          this.render();
          break;
        case 'no-icons':
          this.noIcons = bool(nv);
          break;
        case 'token':
          this.token = this._parseJsonAttribute(nv, 'token');
          break;
        case 'user':
          this.user = this._parseJsonAttribute(nv, 'user');
          break;
        case 'auto-reload-on-submit':
          this.autoReloadOnSubmit = bool(nv);
          break;
      }
    }

    /**
     * Safely parses JSON attribute values with error handling.
     *
     * @param {string} value - The JSON string to parse
     * @param {string} attributeName - Name of attribute (for error logging)
     * @returns {Object|null} Parsed object or null if invalid JSON
     * @private
     */
    _parseJsonAttribute(value, attributeName) {
      const result = FormViewerUtils.safeJsonParse(
        value,
        `${attributeName} attribute`
      );
      if (!result.success) {
        this._log.warn(result.error, { value });
      }
      return result.data;
    }

    /** Initialize logger, decide render root, and paint shell */
    connectedCallback() {
      // Init logger if not set via attribute
      if (!this.hasAttribute('debug')) {
        const globalDebug = globalThis.CHEFS_VIEWER_DEBUG === true;
        this._log = createLogger(globalDebug);
      }
      // Set render root by attribute
      if (this.hasAttribute('no-shadow')) this._root = this;
      this.render();

      // Do not autoload; avoid double-load races with attribute changes and external callers
    }

    disconnectedCallback() {
      this.destroy();
    }

    // Public API
    /**
     * Loads the form schema and initializes the Form.io instance.
     *
     * This is the main entry point for rendering a form. Call this method after
     * setting all required attributes (form-id, api-key) and any optional configuration.
     *
     * @returns {Promise<void>} Resolves when form is loaded and ready
     * @throws {Error} If form schema fails to load or Form.io initialization fails
     *
     * @fires ChefsFormViewer#formio:beforeLoad - Before loading begins (cancelable)
     * @fires ChefsFormViewer#formio:beforeLoadSchema - Before schema fetch (cancelable)
     * @fires ChefsFormViewer#formio:loadSchema - After schema is loaded
     * @fires ChefsFormViewer#formio:beforeInit - Before Form.io initialization (cancelable)
     * @fires ChefsFormViewer#formio:ready - When form is ready for interaction
     * @fires ChefsFormViewer#formio:error - If loading fails
     *
     * @example
     * const viewer = document.querySelector('chefs-form-viewer');
     * viewer.formId = '12345';
     * // Set either authToken or apiKey for authentication
     * // authToken is short lived and secured token from CHEFS
     * viewer.authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....';
     * // or use apiKey (not both)
     * // apiKey is last resort as it should not be publically known/shared.
     * viewer.apiKey = 'your-api-key';
     * await viewer.load();
     */
    async load() {
      if (!this._acquireBusyLock('load')) return;
      this._log.info('load:begin', { formId: this.formId });

      const proceed = this._emit(
        'formio:beforeLoad',
        { formId: this.formId },
        { cancelable: true }
      );
      if (!proceed) {
        this._releaseBusyLock();
        return;
      }

      try {
        await this._loadSchema();
        await this._initFormio();
        this._releaseBusyLock(); // Unlock before emitting ready
        this._emit('formio:ready', { form: this.form });
        this._log.info('load:done');
      } catch (e) {
        this._releaseBusyLock();
        throw e;
      }
    }

    /**
     * Reloads the form schema and re-initializes the Form.io instance.
     *
     * Destroys the current Form.io instance and loads fresh schema and configuration.
     * Useful when form definition has changed or you need to reset form state.
     *
     * @returns {Promise<void>} Resolves when form is reloaded and ready
     * @throws {Error} If reload fails (same conditions as load())
     *
     * @example
     * // Reload after form definition changes
     * await viewer.reload();
     */
    async reload() {
      this._log.info('reload:begin');
      await this.destroy();
      await this.load();
    }

    /**
     * Refreshes the authentication token by POSTing to the backend refresh endpoint.
     * Updates this.authToken with the new token if successful and automatically
     * schedules the next refresh based on the token's expiry time.
     *
     * The new token is immediately available to all Form.io requests through the
     * dynamic auth plugin without requiring any plugin re-registration.
     *
     * @returns {Promise<void>} Resolves when refresh completes
     *
     * @fires ChefsFormViewer#formio:authTokenRefreshed - When token refresh succeeds
     * @fires ChefsFormViewer#formio:error - When token refresh fails
     *
     * @example
     * // Manually refresh the token
     * await viewer.refreshAuthToken();
     *
     * @example
     * // Listen for token refresh events
     * viewer.addEventListener('formio:authTokenRefreshed', (event) => {
     *   console.log('New token:', event.detail.authToken);
     *   console.log('Old token:', event.detail.oldToken);
     * });
     */
    async refreshAuthToken() {
      const base = this.getBaseUrl();
      const refreshUrl = `${base}/gateway/v1/auth/refresh`;
      try {
        const res = await fetch(refreshUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.authToken
              ? { Authorization: `Bearer ${this.authToken}` }
              : {}),
          },
          body: JSON.stringify({ refreshToken: this.authToken }),
        });
        if (!res.ok) {
          const msg = await this._parseError(
            res,
            'Failed to refresh auth token'
          );
          this._log.error('authToken:refresh:error', { msg });
          this._emit('formio:error', { error: msg });
          return;
        }
        const data = await res.json();
        if (data?.token) {
          const oldToken = this.authToken;
          this.authToken = data.token;
          this._log.info('authToken:refresh:ok');
          this._emit('formio:authTokenRefreshed', {
            authToken: data.token,
            oldToken,
          });
          // Schedule next refresh - NO plugin re-registration needed
          this._scheduleNextTokenRefresh();
        } else {
          this._log.warn('authToken:refresh:noToken', { data });
          this._emit('formio:error', { error: 'No token in refresh response' });
        }
      } catch (error) {
        this._log.error('authToken:refresh:exception', {
          error: error.message,
        });
        this._emit('formio:error', { error: error.message });
      }
    }

    /**
     * Programmatically submits the form data to the backend.
     *
     * Sets the submit flag and posts current form data to the submission endpoint.
     * Equivalent to user clicking a submit button.
     *
     * @returns {Promise<void>} Resolves when submission completes
     *
     * @fires ChefsFormViewer#formio:beforeSubmit - Before submission begins (cancelable)
     * @fires ChefsFormViewer#formio:submit - When submission starts
     * @fires ChefsFormViewer#formio:submitDone - When submission succeeds
     * @fires ChefsFormViewer#formio:beforeAutoReload - Before auto-reload starts (cancelable, if auto-reload enabled)
     * @fires ChefsFormViewer#formio:autoReload - When auto-reload begins (if auto-reload enabled)
     * @fires ChefsFormViewer#formio:autoReloadComplete - When auto-reload completes (if auto-reload enabled)
     * @fires ChefsFormViewer#formio:error - If submission or auto-reload fails
     *
     * @example
     * // Submit form programmatically
     * await viewer.submit();
     */
    async submit() {
      if (!this._acquireBusyLock('submit')) return;
      try {
        await this._programmaticSubmit(true);
      } finally {
        this._releaseBusyLock();
      }
    }

    /**
     * Saves the form data to the backend as a draft (not final submission).
     *
     * Sets the submit flag to false and posts current form data. Allows users
     * to save progress without final submission.
     *
     * @returns {Promise<void>} Resolves when draft save completes
     *
     * @fires ChefsFormViewer#formio:beforeSubmit - Before save begins (cancelable)
     * @fires ChefsFormViewer#formio:submit - When save starts
     * @fires ChefsFormViewer#formio:submitDone - When save succeeds
     * @fires ChefsFormViewer#formio:error - If save fails
     *
     * @example
     * // Save as draft
     * await viewer.draft();
     */
    async draft() {
      if (!this._acquireBusyLock('draft')) return;
      try {
        await this._programmaticSubmit(false);
      } finally {
        this._releaseBusyLock();
      }
    }

    /**
     * Sets the form data programmatically (pre-fills the form).
     *
     * Updates the Form.io instance with the provided data object.
     * Useful for editing existing submissions or pre-populating forms.
     *
     * @param {Object} data - The data object to populate the form with
     *
     * @example
     * // Pre-fill form with data
     * viewer.setSubmission({
     *   firstName: 'John',
     *   lastName: 'Doe',
     *   email: 'john@example.com'
     * });
     */
    setSubmission(data) {
      if (!this.formioInstance) return;
      if (this.formioInstance.setSubmission)
        this.formioInstance.setSubmission({ data });
      else this.formioInstance.submission = { data };
    }

    /**
     * Gets the current form data from the Form.io instance.
     *
     * Retrieves the current state of all form fields as a data object.
     * Returns null if form is not yet initialized.
     *
     * @returns {Object|null} Current form data object, or null if not available
     *
     * @example
     * // Get current form data
     * const data = viewer.getSubmission();
     * console.log(data?.data?.firstName); // Access field values
     */
    getSubmission() {
      return this.formioInstance?.submission || null;
    }

    /**
     * Destroys the Form.io instance and cleans up resources.
     *
     * Safely destroys the current Form.io instance to prevent memory leaks.
     * Called automatically when the element is disconnected from DOM.
     *
     * @returns {Promise<void>} Resolves when cleanup is complete
     *
     * @example
     * // Manually destroy (usually not needed)
     * await viewer.destroy();
     */
    async destroy() {
      if (this.formioInstance?.destroy) this.formioInstance.destroy();
      this.formioInstance = null;
    }

    // Internals
    /** Compute base URL when not explicitly provided */
    getBaseUrl() {
      if (this.baseUrl) return this.baseUrl;
      return FormViewerUtils.parseBaseUrl(globalThis.location);
    }

    /**
     * Attempts to acquire the busy lock for an action.
     * Logs and returns false if already busy, otherwise sets busy and returns true.
     * @param {string} actionName - Name of the action (for logging)
     * @returns {boolean} True if lock acquired, false if busy
     */
    _acquireBusyLock(actionName) {
      if (this._isBusy) {
        this._log.info(`${actionName}:skip:busy`);
        return false;
      }
      this._isBusy = true;
      return true;
    }

    /**
     * Releases the busy lock.
     */
    _releaseBusyLock() {
      this._isBusy = false;
    }

    /** Default backend endpoints; embedders can override via .endpoints */
    _defaultEndpoints() {
      const base = this.getBaseUrl();
      const fid = this.formId || ':formId';
      const sid = this.submissionId || ':submissionId';
      return {
        // Complete CHEFS CSS bundle (includes Bootstrap, Vuetify, Form.io, custom styles)
        mainCss: `${base}/webcomponents/v1/assets/chefs-index.css`,
        formioJs: `${base}/webcomponents/v1/assets/formio.js`,
        componentsJs: `${base}/webcomponents/v1/form-viewer/components`,
        // CHEFS theme CSS with CSS variables and theming
        themeCss: `${base}/webcomponents/v1/assets/chefs-theme.css`,
        // Default to local Font Awesome 4.7 for Form.io icon classes (fa fa-*)
        // Served by backend to ensure fonts load in Shadow DOM without CORS/CSP issues.
        // Embedders can override via endpoints.iconsCss, or disable via 'no-icons'.
        iconsCss: `${base}/webcomponents/v1/assets/font-awesome/css/font-awesome.min.css`,

        // CDN fallback URLs
        formioJsFallback:
          'https://cdn.jsdelivr.net/npm/formiojs@4.17.4/dist/formio.full.min.js',
        iconsCssFallback:
          'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',

        schema: `${base}/webcomponents/v1/form-viewer/${fid}/schema`,
        submit: `${base}/webcomponents/v1/form-viewer/${fid}/submit`,
        readSubmission: `${base}/webcomponents/v1/form-viewer/${fid}/submission/${sid}`,

        // simplefile component routes
        files: `${base}/webcomponents/v1/files`,
        deleteFile: `${base}/webcomponents/v1/files/:fileId`,
        getFile: `${base}/webcomponents/v1/files/:fileId`,
        uploadFile: `${base}/webcomponents/v1/files?formId=${fid}`,

        // bcgeoaddress component routes
        bcgeoaddress: `${base}/webcomponents/v1/bcgeoaddress/advance/address`,
      };
    }

    _urls() {
      const d = this._defaultEndpoints();
      const u = { ...d, ...this.endpoints };
      return u;
    }

    _buildAuthHeader(url) {
      if (typeof this.onBuildAuthHeader === 'function') {
        const customHeader = this.onBuildAuthHeader(url);
        if (customHeader && typeof customHeader === 'object') {
          return customHeader;
        }
      }

      // Prefer gateway token (X-Chefs-Gateway-Token) over Basic auth
      if (url.startsWith(this.getBaseUrl())) {
        if (this.authToken) {
          return { 'X-Chefs-Gateway-Token': this.authToken };
        }

        if (this.formId && this.apiKey) {
          try {
            return FormViewerUtils.createBasicAuthHeader(
              this.formId,
              this.apiKey
            );
          } catch (e) {
            this._log.warn('Failed to create Basic Auth header', {
              error: e.message,
            });
          }
        }
      }

      return {};
    }

    /**
     * Checks if a header value should be blocked from passthrough.
     * Specifically blocks Authorization Basic auth to prevent overriding CHEFS Basic auth.
     *
     * @param {string} headerName - Header name (case-insensitive)
     * @param {string} headerValue - Header value
     * @returns {boolean} True if header should be blocked
     * @private
     */
    _isPassthroughHeaderBlocked(headerName, headerValue) {
      const lowerName = headerName.toLowerCase();

      // Block headers in the blocklist
      if (BLOCKED_PASSTHROUGH_HEADERS.includes(lowerName)) {
        return true;
      }

      // Block Authorization Basic auth (CHEFS may use Basic auth as fallback)
      if (
        lowerName === 'authorization' &&
        headerValue &&
        headerValue.trim().toLowerCase().startsWith('basic ')
      ) {
        return true;
      }

      return false;
    }

    /**
     * Gets passthrough headers from host application if provided via callback.
     * Allows host applications to inject headers that will be passed through
     * to CHEFS backend requests for downstream services.
     *
     * @param {string} url - Request URL
     * @returns {Object|undefined} Passthrough headers object or undefined
     * @private
     */
    _getPassthroughHeaders(url) {
      if (typeof this.onPassthroughHeaders === 'function') {
        const result = this.onPassthroughHeaders(url);
        if (result && typeof result === 'object') {
          // Filter out blocked headers
          const filtered = {};
          for (const [key, value] of Object.entries(result)) {
            if (!this._isPassthroughHeaderBlocked(key, value)) {
              filtered[key] = value;
            }
          }
          return Object.keys(filtered).length > 0 ? filtered : undefined;
        }
      }
      return undefined;
    }

    /**
     * Merges auth headers with existing headers, preserving passthrough headers
     * from the host application so they can be passed downstream to CHEFS backend.
     * CHEFS uses X-Chefs-Gateway-Token for authentication, but passthrough headers
     * from the host application are preserved for downstream services.
     *
     * @param {Object} existingHeaders - Existing headers object (may contain passthrough headers)
     * @param {Object} authHeaders - CHEFS auth headers (X-Chefs-Gateway-Token)
     * @param {string} url - Request URL (for callback-based passthrough headers)
     * @returns {Object} Merged headers with passthrough headers preserved
     * @private
     */
    _mergeHeadersWithAuth(existingHeaders = {}, authHeaders = {}, url = '') {
      const merged = { ...existingHeaders, ...authHeaders };

      // Get passthrough headers from callback if provided
      const passthroughHeaders = this._getPassthroughHeaders(url);
      if (passthroughHeaders) {
        // Merge passthrough headers, filtering out blocked headers
        for (const [key, value] of Object.entries(passthroughHeaders)) {
          if (!this._isPassthroughHeaderBlocked(key, value)) {
            merged[key] = value;
          }
        }
      }

      // Preserve Authorization header from existing headers if present
      // (in case Form.io or other code sets it, but don't override CHEFS Basic auth)
      const authKey = Object.keys(existingHeaders).find(
        (key) => key.toLowerCase() === 'authorization'
      );
      if (authKey && existingHeaders[authKey]) {
        // Only preserve if it's not Basic auth (CHEFS Basic auth is already in authHeaders)
        const authValue = existingHeaders[authKey];
        if (!authValue.trim().toLowerCase().startsWith('basic ')) {
          merged[authKey] = existingHeaders[authKey];
        }
      }

      return merged;
    }

    _getSubmitButtonKey() {
      return this.submitButtonKey || 'submit';
    }

    /**
     * Resolve URL using pure function with current component state
     * @param {string} endpointKey - Endpoint key to resolve
     * @param {Object} customParams - Custom parameters (optional)
     * @returns {string} Resolved URL
     */
    _resolveUrl(endpointKey, customParams = {}) {
      const params = {
        formId: this.formId,
        submissionId: this.submissionId,
        ...customParams,
      };
      return FormViewerUtils.resolveUrl(
        this._urls(),
        endpointKey,
        params,
        this.endpoints || {}
      );
    }

    /**
     * Resolve URL with fallback support
     * @param {string} primaryKey - Primary endpoint key
     * @param {string} fallbackKey - Fallback endpoint key
     * @returns {Object} { primary: string, fallback: string|null }
     */
    _resolveUrlWithFallback(primaryKey, fallbackKey) {
      const params = {
        formId: this.formId,
        submissionId: this.submissionId,
      };
      return FormViewerUtils.resolveUrlWithFallback(
        this._urls(),
        primaryKey,
        fallbackKey,
        params,
        this.endpoints || {}
      );
    }

    /**
     * Internal helper to perform programmatic submit/draft with a single path
     * @param {boolean} isSubmit True for submit, false for draft
     */
    async _programmaticSubmit(isSubmit) {
      if (!this.formioInstance) return;
      this._log.info(isSubmit ? 'submit:programmatic' : 'draft:programmatic');
      const currentData =
        this.formioInstance?.submission?.data ||
        (typeof this.formioInstance.getValue === 'function'
          ? this.formioInstance.getValue()
          : this.formioInstance?.data) ||
        {};
      const submitKey = this._getSubmitButtonKey();
      currentData[submitKey] = isSubmit;
      await this._manualSubmit({ data: currentData }, isSubmit);
    }

    _emit(name, detail, opts = {}) {
      // debug: emit
      const ev = new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true,
        cancelable: !!opts.cancelable,
      });
      return this.dispatchEvent(ev);
    }

    async _createFormioInstance(container, schema, options) {
      const hasCreateForm = FormViewerUtils.validateGlobalMethods(
        globalThis,
        'Formio',
        ['createForm']
      );

      if (hasCreateForm) {
        return globalThis.Formio.createForm(container, schema, options);
      }
      return new globalThis.Formio.Form(container, schema, options);
    }

    _configureInstanceEndpoints() {
      this.formioInstance.url = this._resolveUrl('submit');
    }

    async _parseError(res, fallback) {
      const errJson = await res.json().catch(() => null);
      return this.parsers.error(errJson) || fallback;
    }

    /**
     * Generic resource hint helper
     * @param {string} rel - The relationship type (preload, prefetch, preconnect, dns-prefetch)
     * @param {string} href - The URL to hint
     * @param {Object} options - Additional options (as, type, crossOrigin, etc.)
     */
    _addResourceHint(rel, href, options = {}) {
      if (!href) return;

      // Check if hint already exists
      const selector = `link[rel="${rel}"][href="${href}"]`;
      if (document.querySelector(selector)) return;

      const attributes = {
        rel,
        href,
        ...options,
      };

      const link = FormViewerUtils.createElement('link', attributes);
      FormViewerUtils.appendElement(link, null, document.head);
      this._log.debug(`Added ${rel} hint for: ${href}`);
    }

    /** Load a stylesheet into shadow or document head preserving URL resolution, with timeout and error handling */
    async _loadCssIntoRoot(href) {
      try {
        FormViewerUtils.validateAssetUrl(href, 'css');
      } catch (err) {
        this._log.error(err.message, { href });
        return false;
      }
      return await new Promise((resolve) => {
        let settled = false;
        const timeout = setTimeout(() => {
          if (!settled) {
            settled = true;
            this._log.error('CSS load timed out', { href });
            resolve(false);
          }
        }, 10000); // 10s timeout
        const linkElement = FormViewerUtils.createElement('link', {
          rel: 'stylesheet',
          href,
        });
        linkElement.onload = () => {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            resolve(true);
          }
        };
        linkElement.onerror = () => {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            this._log.error('CSS load failed', { href });
            resolve(false);
          }
        };
        const targetParent =
          this._root === this.shadowRoot ? this.shadowRoot : document.head;
        FormViewerUtils.appendElement(linkElement, targetParent);
      });
    }

    /** Injects a script into document head, with timeout and error handling */
    _injectScript(src) {
      try {
        FormViewerUtils.validateAssetUrl(src, 'js');
      } catch (err) {
        this._log.error(err.message, { src });
        return Promise.resolve(false);
      }
      return new Promise((resolve) => {
        let settled = false;
        const timeout = setTimeout(() => {
          if (!settled) {
            settled = true;
            this._log.error('Script load timed out', { src });
            resolve(false);
          }
        }, 10000); // 10s timeout
        const script = FormViewerUtils.createElement('script', { src });
        script.onload = () => {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            resolve(true);
          }
        };
        script.onerror = () => {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            this._log.error('Script load failed', { src });
            resolve(false);
          }
        };
        FormViewerUtils.appendElement(script, null, document.head);
      });
    }

    /** Generate Font Awesome @font-face CSS */
    _getFontFaceCSS() {
      return FormViewerUtils.generateFontFaceCSS(this.getBaseUrl());
    }

    /** Generate icon color inheritance CSS */
    _getIconColorCSS() {
      return FormViewerUtils.generateIconColorCSS();
    }

    /** Generate icon neutralization CSS */
    _getNeutralizeCSS() {
      return FormViewerUtils.generateIconNeutralizeCSS();
    }

    /** Inject global style (document head) */
    _injectGlobalStyle(id, css) {
      FormViewerUtils.injectStyle(css, document.head, id);
    }

    /** Inject style into Shadow DOM */
    _injectShadowStyle(css) {
      if (this._root !== this.shadowRoot) return;
      FormViewerUtils.injectStyle(css, this.shadowRoot);
    }

    /** Apply submission data to the live instance with best-effort redraw */
    async _setSubmissionOnInstance(dataToApply, opts) {
      if (typeof this.formioInstance?.setSubmission === 'function') {
        await this.formioInstance.setSubmission({ data: dataToApply }, opts);
        return;
      }
      this.formioInstance.submission = { data: dataToApply };
      if (typeof this.formioInstance?.redraw === 'function') {
        await this.formioInstance.redraw();
      }
    }

    /** Re-emit core Form.io events as component-level CustomEvents */
    _wireInstanceEvents() {
      this.formioInstance.on('render', () =>
        this._emit('formio:render', { form: this.form })
      );
      this.formioInstance.on('change', (evt) =>
        this._emit('formio:change', {
          changed: evt.changed,
          submission: evt.submission,
        })
      );
      this.formioInstance.on('submit', (payload) =>
        this._emit('formio:submit', { submission: payload })
      );
      this.formioInstance.on('submitDone', (result) =>
        this._emit('formio:submitDone', { submission: result })
      );
      this.formioInstance.on('error', (err) =>
        this._emit('formio:error', { error: err?.message || String(err) })
      );
    }

    /** Fetch and parse the form schema from the backend */
    async _loadSchema() {
      const url = this._resolveUrl('schema');
      this._log.info('schema:request', { url });
      if (!this._emit('formio:beforeLoadSchema', { url }, { cancelable: true }))
        return;

      const authHeaders = this._buildAuthHeader(url);
      const res = await fetch(url, {
        headers: this._mergeHeadersWithAuth({}, authHeaders, url),
      });
      if (!res.ok) {
        const msg = await this._parseError(res, 'Failed to load form schema');
        this._emit('formio:error', { error: msg });
        this._log.error('schema:error', { msg });
        throw new Error(msg);
      }
      const data = await res.json();
      const parsed = this.parsers.schema(data);
      this.form = parsed.form;
      this.formSchema = parsed.schema;

      // Set metadata properties for easy access (Approach 1 support)
      this.formName = this.form?.name || null;
      this.formDescription = this.form?.description || null;
      this.formMetadata = this.form || null;

      this._log.info('schema:ok');
      this._emit('formio:loadSchema', {
        form: this.form,
        schema: this.formSchema,
      });
    }

    /**
     * Asset Loading State Machine - simplified and integrated
     * States: IDLE → HINTS → CSS → JS → FONTS → READY
     */
    async _ensureAssets() {
      this._log.info('assets:ensure');
      this._assetState = 'IDLE';
      this._assetErrors = [];
      this._loadedAssets = new Map();

      try {
        await this._transitionAssetState('HINTS');
        await this._transitionAssetState('CSS');
        await this._transitionAssetState('JS');
        await this._transitionAssetState('FONTS');
        await this._transitionAssetState('READY');

        this._log.info('assets:complete', {
          success: true,
          errors: this._assetErrors.length,
        });

        return { success: true, errors: this._assetErrors };
      } catch (error) {
        this._assetState = 'ERROR';
        this._log.error('Asset loading failed', error);
        throw error;
      }
    }

    async _transitionAssetState(newState) {
      const oldState = this._assetState;
      this._log.debug(`Asset loading: ${oldState} → ${newState}`);
      this._assetState = newState;

      // Execute state-specific loading
      switch (newState) {
        case 'HINTS':
          await this._loadAssetHints();
          break;
        case 'CSS':
          await this._loadCssAssets();
          break;
        case 'JS':
          await this._loadJsAssets();
          break;
        case 'FONTS':
          await this._loadFontsAndStyles();
          break;
        case 'READY':
          this._log.info('Asset loading complete');
          break;
      }

      // Emit state change event
      this._emit('formio:assetStateChange', {
        from: oldState,
        to: newState,
        assets: Array.from(this._loadedAssets.keys()),
        errors: this._assetErrors.length,
      });
    }

    async _loadAssetHints() {
      // CDN preconnects for fallbacks
      this._addResourceHint('preconnect', 'https://cdn.jsdelivr.net', {
        crossOrigin: 'anonymous',
      });
      this._addResourceHint('preconnect', 'https://cdnjs.cloudflare.com', {
        crossOrigin: 'anonymous',
      });
      this._addResourceHint('dns-prefetch', 'https://cdn.form.io');

      // Critical asset preloads
      this._addResourceHint('preload', this._resolveUrl('mainCss'), {
        as: 'style',
      });

      const formioAvailable = FormViewerUtils.validateGlobalMethods(
        globalThis,
        'Formio',
        []
      );
      if (!formioAvailable) {
        this._addResourceHint('preload', this._resolveUrl('formioJs'), {
          as: 'script',
        });
      }

      // Note: We don't prefetch resources that are loaded immediately
      // (schema, componentsJs, readSubmission) to avoid NS_BINDING_ABORTED errors.
      // The browser would abort the prefetch and start a new request anyway.
    }

    async _loadCssAssets() {
      // Critical CSS (required)
      await this._loadAssetWithFallback(
        this._resolveUrl('mainCss'),
        null, // no fallback
        true, // required
        'critical-css'
      );

      // Icons CSS (optional, with fallback)
      if (!this.noIcons) {
        const { primary, fallback } = this._resolveUrlWithFallback(
          'iconsCss',
          'iconsCssFallback'
        );
        await this._loadAssetWithFallback(
          primary,
          fallback,
          false, // optional
          'icons-css'
        );
      }

      // Theme CSS (optional)
      const themeHref = this.themeCss || this._resolveUrl('themeCss');
      if (themeHref) {
        await this._loadAssetWithFallback(themeHref, null, false, 'theme-css');
      }
    }

    async _loadJsAssets() {
      // Form.io JS (required, with fallback and validation)
      const formioStatus = FormViewerUtils.validateFormioGlobal(globalThis);
      if (!formioStatus.available) {
        const { primary, fallback } = this._resolveUrlWithFallback(
          'formioJs',
          'formioJsFallback'
        );
        await this._loadAssetWithFallback(
          primary,
          fallback,
          true, // required
          'formio-js',
          () => FormViewerUtils.validateFormioGlobal(globalThis).hasCreateForm
        );
      }

      // Components JS (required)
      await this._loadAssetWithFallback(
        this._resolveUrl('componentsJs'),
        null,
        true,
        'components-js'
      );
    }

    async _loadFontsAndStyles() {
      if (this.noIcons) {
        // Neutralize icons in Shadow DOM
        if (this._root === this.shadowRoot) {
          this._injectShadowStyle(this._getNeutralizeCSS());
        }
        return;
      }

      const usingCustomIcons = !!this.endpoints?.iconsCss;
      const shouldPreloadFonts = !usingCustomIcons;

      // Inject @font-face CSS first (only for default setup)
      if (shouldPreloadFonts) {
        // Inject @font-face CSS first so fonts can be discovered
        this._injectGlobalStyle('cfv-fa-face', this._getFontFaceCSS());

        // Preload font after @font-face is available
        const fontHref = `${this.getBaseUrl()}/webcomponents/v1/assets/font-awesome/fonts/fontawesome-webfont.woff2?v=4.7.0`;
        this._addResourceHint('preload', fontHref, {
          as: 'font',
          type: 'font/woff2',
          crossOrigin: 'anonymous',
        });
      }

      // Icon color inheritance for Shadow DOM
      if (this._root === this.shadowRoot) {
        this._injectShadowStyle(this._getIconColorCSS());
      }
    }

    // Asset loader with fallback, timeout, and error handling
    async _loadAssetWithFallback(
      primaryUrl,
      fallbackUrl,
      required,
      assetType,
      validateFn
    ) {
      if (this._isAssetPreLoaded(assetType, validateFn)) return true;

      this._log.info('Loading asset', { assetType, primaryUrl, fallbackUrl });
      const loadFn = this._getAssetLoadFunction(primaryUrl);
      let loaded;
      try {
        loaded = await this._tryLoadWithFallback(
          primaryUrl,
          fallbackUrl,
          assetType,
          loadFn,
          !required
        );
      } catch (err) {
        this._log.error('Asset load threw error', {
          assetType,
          error: err.message,
        });
        loaded = false;
      }

      try {
        this._validateLoadedAsset(loaded, assetType, validateFn);
      } catch (err) {
        this._log.error('Asset validation failed', {
          assetType,
          error: err.message,
        });
        loaded = false;
      }
      this._handleLoadResult(
        loaded,
        primaryUrl,
        fallbackUrl,
        required,
        assetType
      );

      return loaded;
    }

    _isAssetPreLoaded(assetType, validateFn) {
      if (validateFn && validateFn()) {
        this._loadedAssets.set(assetType, 'pre-loaded');
        return true;
      }
      return false;
    }

    /**
     * Detect asset type by Content-Type header using HEAD request
     * Returns 'js', 'css', or null
     */
    async _detectAssetTypeByContentType(url) {
      try {
        const resp = await fetch(url, { method: 'HEAD' });
        const ct = resp.headers.get('content-type') || '';
        if (ct.includes('javascript')) return 'js';
        if (ct.includes('css')) return 'css';
        this._log.error('Unknown asset Content-Type', { url, contentType: ct });
        return null;
      } catch (err) {
        this._log.error('Failed to detect asset Content-Type', {
          url,
          error: err.message,
        });
        return null;
      }
    }

    _getAssetLoadFunction(url) {
      if (!url || typeof url !== 'string') {
        return () => Promise.resolve(false);
      }
      // Content-Type detection first
      return async (url) => {
        const assetType = await this._detectAssetTypeByContentType(url);
        if (assetType === 'js') return await this._injectScript(url);
        if (assetType === 'css') return await this._loadCssIntoRoot(url);
        // Fallback to extension if Content-Type is unknown or HEAD fails
        if (url.endsWith('.js')) return await this._injectScript(url);
        if (url.endsWith('.css')) return await this._loadCssIntoRoot(url);
        // Unknown type
        this._log.error('Unknown asset type for URL', { url });
        return false;
      };
    }

    async _tryLoadWithFallback(primaryUrl, fallbackUrl, assetType, loadFn) {
      let loaded = false;
      try {
        loaded = await loadFn(primaryUrl);
      } catch (err) {
        this._log.error('Primary asset load threw error', {
          assetType,
          error: err.message,
        });
        loaded = false;
      }

      if (!loaded && fallbackUrl) {
        this._log.warn(`Using fallback for ${assetType}`, { fallbackUrl });
        // Use content detection for fallback as well
        const fallbackLoadFn = this._getAssetLoadFunction(fallbackUrl);
        try {
          loaded = await fallbackLoadFn(fallbackUrl);
        } catch (err) {
          this._log.error('Fallback asset load threw error', {
            assetType,
            error: err.message,
          });
          loaded = false;
        }
        if (loaded) {
          this._loadedAssets.set(`${assetType}-fallback`, fallbackUrl);
        }
      }

      return loaded;
    }

    _validateLoadedAsset(loaded, assetType, validateFn) {
      if (loaded && validateFn && !validateFn()) {
        throw new Error(`Asset validation failed: ${assetType}`);
      }
    }

    _handleLoadResult(loaded, primaryUrl, fallbackUrl, required, assetType) {
      if (!loaded) {
        if (required) {
          throw new Error(`Failed to load required asset: ${assetType}`);
        }
        this._assetErrors.push({
          type: assetType,
          url: primaryUrl,
          fallback: fallbackUrl,
          error: 'Optional asset failed to load',
        });
      } else if (!this._loadedAssets.has(assetType)) {
        this._loadedAssets.set(assetType, primaryUrl);
      }
    }

    /**
     * Registers a Form.io auth plugin that dynamically attaches auth headers to CHEFS requests.
     * The plugin resolves auth headers on every request, automatically picking up token changes
     * without requiring re-registration. Only registers once per component instance.
     *
     * The plugin prefers gateway token (authToken) sent via X-Chefs-Gateway-Token header
     * over Basic auth (apiKey) and only applies headers to requests targeting the component's base URL.
     *
     * @private
     */
    _registerAuthPlugin() {
      const formioAvailable = FormViewerUtils.validateGlobalMethods(
        globalThis,
        'Formio',
        ['registerPlugin']
      );
      if (!formioAvailable) return;

      // Check if our plugin is already registered
      if (this._authPluginRegistered) return;

      const base = this.getBaseUrl();
      const plugin = {
        priority: 0,
        preRequest: (args) => {
          if (!args?.url?.startsWith(base)) return;

          // DYNAMIC header resolution - gets fresh token every time
          const authHeader = this._buildAuthHeader(args.url);
          if (authHeader && Object.keys(authHeader).length > 0) {
            args.opts = args.opts || {};
            args.opts.headers = this._mergeHeadersWithAuth(
              args.opts.headers,
              authHeader,
              args.url
            );
          }
        },
        preStaticRequest: (args) => {
          if (!args?.url?.startsWith(base)) return;

          // DYNAMIC header resolution
          const authHeader = this._buildAuthHeader(args.url);
          if (authHeader && Object.keys(authHeader).length > 0) {
            args.opts = args.opts || {};
            args.opts.headers = this._mergeHeadersWithAuth(
              args.opts.headers,
              authHeader,
              args.url
            );
          }
        },
      };

      // Register once with a consistent name
      globalThis.Formio.registerPlugin(plugin, 'chefs-viewer-auth');
      this._authPluginRegistered = true;
      this._log.info('Auth plugin registered once');

      // Set global auth type indicator for backward compatibility
      if (this.authToken) {
        globalThis.__chefsViewerAuth = 'bearer';
      } else if (this.apiKey) {
        globalThis.__chefsViewerAuth = 'basic';
      }
    }

    /**
     * Initializes automatic token refresh if an auth token is present.
     * Called during component initialization to set up the refresh cycle.
     *
     * @private
     */
    async _initAuthTokenRefresh() {
      if (this.authToken) {
        this._scheduleNextTokenRefresh();
      }
    }

    /**
     * Schedules the next automatic token refresh based on the current JWT's expiry time.
     * Clears any existing refresh timer and sets up a new one to refresh the token
     * 60 seconds before expiry (minimum 10 seconds from now).
     *
     * This method is called automatically by refreshAuthToken() and _initAuthTokenRefresh().
     * The timer will trigger refreshAuthToken() which will call this method again,
     * creating a continuous refresh cycle.
     *
     * @private
     */
    _scheduleNextTokenRefresh() {
      if (!this.authToken) return;

      // Clear any existing timer
      if (this._jwtRefreshTimer) {
        clearTimeout(this._jwtRefreshTimer);
        this._jwtRefreshTimer = null;
      }

      const expiry = FormViewerUtils.getJwtExpiry(this.authToken);
      if (!expiry) return;

      const now = Math.floor(Date.now() / 1000);
      let secondsUntilRefresh = expiry - now - 60; // 60 seconds before expiry
      if (secondsUntilRefresh < 10) secondsUntilRefresh = 10; // minimum 10 seconds

      this._log.info('authToken:autoRefreshScheduled', {
        refreshIn: secondsUntilRefresh,
        expiry,
        now,
      });

      this._jwtRefreshTimer = setTimeout(async () => {
        this._log.info('authToken:autoRefreshTrigger');
        await this.refreshAuthToken();
        // refreshAuthToken() will call _scheduleNextTokenRefresh() again
      }, secondsUntilRefresh * 1000);
    }

    _buildHooks() {
      return {
        beforeSubmit: async (submission, _next) => {
          await this._manualSubmit(submission);
          // Do not call next(); handled manually
        },
        beforeNext: async (currentPage, submission, next) => {
          const proceed = this._emitCancelable('formio:beforeNext', {
            currentPage,
            submission,
          });
          if (!proceed) return;
          const allow = await this._waitUntil('formio:beforeNext', {
            currentPage,
            submission,
          });
          if (allow) next();
        },
        beforePrev: async (currentPage, submission, next) => {
          const proceed = this._emitCancelable('formio:beforePrev', {
            currentPage,
            submission,
          });
          if (!proceed) return;
          const allow = await this._waitUntil('formio:beforePrev', {
            currentPage,
            submission,
          });
          if (allow) next();
        },
      };
    }

    /** Post submission payload to CHEFS backend and emit completion/error */
    async _manualSubmit(submission, isSubmit = true) {
      this._log.info('beforeSubmit', { submission });
      const proceed = this._emitCancelable('formio:beforeSubmit', {
        submission,
      });
      if (!proceed) return;
      const allow = await this._waitUntil('formio:beforeSubmit', {
        submission,
      });
      if (!allow) return;

      const url = this._resolveUrl('submit');
      // debug: submit post
      this._emit('formio:submit', { submission });
      const authHeaders = this._buildAuthHeader(url);
      const res = await fetch(url, {
        method: 'POST',
        headers: this._mergeHeadersWithAuth(
          { 'Content-Type': 'application/json' },
          authHeaders,
          url
        ),
        body: JSON.stringify({ submission }),
      });
      if (!res.ok) {
        const msg = await this._parseError(res, 'Submission failed');
        this._log.error('submit:error', { msg });
        this._emit('formio:error', { error: msg });
        return;
      }
      const result = await res.json().catch(() => ({}));
      const submitParsed = this.parsers.submitResult(result);
      this._log.info('submit:ok');
      this._emit('formio:submitDone', { submission: submitParsed.submission });

      // Auto-reload as read-only after successful submission (if enabled and not a draft)
      if (this.autoReloadOnSubmit && isSubmit && submitParsed.submission?.id) {
        await this._handleAutoReload(submitParsed.submission);
      }
    }

    /**
     * Handles auto-reload behavior after successful submission (not draft).
     *
     * Emits cancelable events to allow customization of the auto-reload behavior.
     * By default, reloads the form as read-only with the submission data.
     * Only runs for actual submissions, not draft saves.
     *
     * @param {Object} submission - The submission object from the successful submission
     * @returns {Promise<void>} Resolves when auto-reload completes or is cancelled
     *
     * @fires ChefsFormViewer#formio:beforeAutoReload - Before auto-reload starts (cancelable)
     * @fires ChefsFormViewer#formio:autoReload - When auto-reload begins
     * @fires ChefsFormViewer#formio:autoReloadComplete - When auto-reload completes
     * @fires ChefsFormViewer#formio:error - If auto-reload fails
     */
    async _handleAutoReload(submission) {
      this._log.info('autoReload:starting', {
        submissionId: submission.id,
      });

      // Emit cancelable event to allow customization or cancellation
      const proceed = this._emitCancelable('formio:beforeAutoReload', {
        submission,
        submissionId: submission.id,
      });
      if (!proceed) {
        this._log.info('autoReload:cancelled');
        return;
      }

      // Wait for any async operations to complete
      const allow = await this._waitUntil('formio:beforeAutoReload', {
        submission,
        submissionId: submission.id,
      });
      if (!allow) {
        this._log.info('autoReload:notAllowed');
        return;
      }

      // Emit event that auto-reload is starting
      this._emit('formio:autoReload', {
        submission,
        submissionId: submission.id,
      });

      try {
        // Wait a moment then reload as read-only (like the demo pattern)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        this.submissionId = submission.id;
        this.readOnly = true;
        await this.reload();

        this._log.info('autoReload:completed');
        this._emit('formio:autoReloadComplete', {
          submission,
          submissionId: submission.id,
        });
      } catch (error) {
        this._log.error('autoReload:failed', { error: error.message });
        this._emit('formio:error', {
          error: `Auto-reload failed: ${error.message}`,
        });
      }
    }

    /** Emit a cancellable event and collect async waits via detail.waitUntil */
    _emitCancelable(name, detail) {
      const waits = [];
      const ev = new CustomEvent(name, {
        detail: {
          ...detail,
          waitUntil: (p) =>
            p && waits.push(Promise.resolve(p).catch(() => false)),
        },
        bubbles: true,
        composed: true,
        cancelable: true,
      });
      const allowed = this.dispatchEvent(ev);
      this._pendingWaits = waits;
      return allowed;
    }

    /** Await pending waits created during _emitCancelable and clear them */
    async _waitUntil() {
      if (!this._pendingWaits || !this._pendingWaits.length) return true;
      const results = await Promise.all(this._pendingWaits);
      this._pendingWaits = [];
      return !results.includes(false);
    }

    /**
     * Private method to handle file upload
     * @param {FormData} formData - Form data containing the file
     * @param {Object} config - Upload configuration options
     * @returns {Promise<Object>} Upload response
     * @private
     */
    async _handleFileUpload(formData, config = {}) {
      const uploadUrl = this._resolveUrl('uploadFile');
      this._log.info('File upload starting', { url: uploadUrl });

      try {
        // Create XMLHttpRequest for progress tracking
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          // Track upload progress
          if (config.onUploadProgress) {
            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable) {
                config.onUploadProgress({
                  loaded: event.loaded,
                  total: event.total,
                });
              }
            });
          }

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                this._log.info('File upload successful', { response });
                resolve({ data: response });
              } catch (parseError) {
                this._log.error('Failed to parse upload response', {
                  error: parseError.message,
                });
                const error = new Error('Invalid response format');
                error.status = xhr.status;
                error.detail = `${xhr.status} - Failed to parse response`;
                reject(error);
              }
            } else {
              this._log.error('File upload failed', {
                status: xhr.status,
                statusText: xhr.statusText,
              });
              const statusText = `Upload failed: ${xhr.status} ${xhr.statusText}`;
              const error = new Error(statusText);
              error.status = xhr.status;
              error.detail = `${xhr.status} - ${xhr.statusText}`;
              reject(error);
            }
          });

          xhr.addEventListener('error', () => {
            this._log.error('File upload network error');
            const error = new Error('Network error during upload');
            error.status = 0;
            error.detail = '0 - Network error';
            reject(error);
          });

          xhr.addEventListener('timeout', () => {
            this._log.error('File upload timeout');
            const error = new Error('Upload timeout');
            error.status = 0;
            error.detail = '0 - Timeout';
            reject(error);
          });

          // Set timeout (30 seconds)
          xhr.timeout = 30000;

          // Open the request first
          xhr.open('POST', uploadUrl);

          // Set auth headers and other headers, but exclude Content-Type for multipart/form-data
          const authHeaders = this._buildAuthHeader(uploadUrl);
          const configHeaders = config.headers || {};

          // Merge headers, preserving Authorization from config if present
          const mergedHeaders = this._mergeHeadersWithAuth(
            configHeaders,
            authHeaders,
            uploadUrl
          );

          // Filter out Content-Type if it's multipart/form-data to let browser set it automatically
          const headers = {};
          for (const [key, value] of Object.entries(mergedHeaders)) {
            if (
              key.toLowerCase() === 'content-type' &&
              value.includes('multipart/form-data')
            ) {
              // Skip this header - let browser set it automatically with boundary
              continue;
            }
            headers[key] = value;
          }

          for (const [key, value] of Object.entries(headers)) {
            xhr.setRequestHeader(key, value);
          }

          xhr.send(formData);
        });
      } catch (error) {
        this._log.error('File upload error', { error: error.message });
        // Ensure error has the expected properties for SimpleFile component
        if (!error.detail) {
          error.detail = error.message || 'Unknown error';
        }
        if (!error.status) {
          error.status = 0;
        }
        throw error;
      }
    }

    /**
     * Private method to handle file download
     * @param {string} fileId - File identifier
     * @param {Object} config - Download configuration options
     * @returns {Promise<void>} Resolves when download completes
     * @private
     */
    async _handleFileDownload(fileId, config = {}) {
      const getFileUrl = this._resolveUrl('getFile', { fileId });
      this._log.info('File download starting', { fileId, url: getFileUrl });

      try {
        const authHeaders = this._buildAuthHeader(getFileUrl);
        const mergedHeaders = this._mergeHeadersWithAuth(
          config.headers,
          authHeaders,
          getFileUrl
        );
        const response = await fetch(getFileUrl, {
          headers: mergedHeaders,
          ...config,
        });

        if (!response.ok) {
          const errorMsg = `Download failed: ${response.status} ${response.statusText}`;
          this._log.error(errorMsg, { fileId, status: response.status });
          throw new Error(errorMsg);
        }

        // Store the download data for download trigger
        this.downloadFile.data = await response.blob();
        this.downloadFile.headers = {
          'content-type':
            response.headers.get('content-type') || 'application/octet-stream',
          'content-disposition':
            response.headers.get('content-disposition') ||
            `attachment; filename="file-${fileId}"`,
        };

        // Trigger download if responseType is 'blob' (default behavior)
        if (config.responseType === 'blob' || !config.responseType) {
          this._triggerFileDownload();
        }

        this._log.info('File download successful', { fileId });
        return;
      } catch (error) {
        this._log.error('File download error', {
          fileId,
          error: error.message,
        });
        throw error;
      }
    }

    /**
     * Private method to handle file deletion
     * @param {Object} fileInfo - File information object
     * @returns {Promise<void>} Resolves when delete completes
     * @private
     */
    async _handleFileDelete(fileInfo) {
      // Extract file ID from various possible formats
      let fileId;
      if (fileInfo?.data?.id) {
        fileId = fileInfo.data.id;
      } else if (fileInfo?.id) {
        fileId = fileInfo.id;
      } else {
        this._log.error('File delete failed: no file ID found', { fileInfo });
        throw new Error('No file ID provided for deletion');
      }

      const deleteUrl = this._resolveUrl('deleteFile', { fileId });
      this._log.info('File delete starting', { fileId, url: deleteUrl });

      try {
        const authHeaders = this._buildAuthHeader(deleteUrl);
        const response = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: this._mergeHeadersWithAuth({}, authHeaders, deleteUrl),
        });

        if (!response.ok) {
          const errorMsg = `Delete failed: ${response.status} ${response.statusText}`;
          this._log.error(errorMsg, { fileId, status: response.status });
          throw new Error(errorMsg);
        }

        this._log.info('File delete successful', { fileId });
        return;
      } catch (error) {
        this._log.error('File delete error', { fileId, error: error.message });
        throw error;
      }
    }

    /**
     * Triggers file download using the stored download data
     * @private
     */
    _triggerFileDownload() {
      if (!this.downloadFile.data || !this.downloadFile.headers) {
        this._log.warn('No download data available');
        return;
      }

      let data = this.downloadFile.data;
      const contentType = this.downloadFile.headers['content-type'];

      // Handle JSON data conversion
      if (contentType.includes('application/json')) {
        if (data instanceof Blob) {
          // If it's already a blob, read it as text and re-stringify
          data
            .text()
            .then((text) => {
              const parsedData = JSON.parse(text);
              const jsonString = JSON.stringify(parsedData);
              data = new Blob([jsonString], { type: contentType });
              this._performDownload(data);
            })
            .catch(() => {
              // Fallback to original data
              this._performDownload(data);
            });
          return;
        } else if (typeof data === 'object') {
          data = new Blob([JSON.stringify(data)], { type: contentType });
        } else if (typeof data === 'string') {
          data = new Blob([data], { type: contentType });
        }
      }

      this._performDownload(data);
    }

    /**
     * Performs the actual file download
     * @param {Blob} data - The data to download
     * @private
     */
    _performDownload(data) {
      const url = globalThis.URL.createObjectURL(data);
      const a = FormViewerUtils.createElement('a', {
        href: url,
        download: this._getFilenameFromDisposition(
          this.downloadFile.headers['content-disposition']
        ),
        style: 'display: none',
      });

      a.classList.add('hiddenDownloadTextElement');
      document.body.appendChild(a);
      a.click();

      // Clean up after a short delay
      setTimeout(() => {
        a.remove();
        globalThis.URL.revokeObjectURL(url);
      }, 100);
    }

    /**
     * Extracts filename from content-disposition header
     * @param {string} disposition - Content-disposition header value
     * @returns {string} Filename
     * @private
     */
    _getFilenameFromDisposition(disposition) {
      if (disposition && disposition.includes('attachment')) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          return matches[1].replaceAll(/['"]/g, '');
        }
      }
      return 'download';
    }

    /**
     * Creates the SimpleFile component options configuration
     * @returns {Object} SimpleFile component configuration
     * @private
     * @example
     *  const viewer = document.querySelector('chefs-form-viewer');
     *  // Example 1: Security check before upload
     *  viewer.addEventListener('formio:beforeFileUpload', (event) => {
     *    const { formData, config } = event.detail;
     *
     *    // Security check: file size limit
     *    const file = formData.get('files');
     *    if (file.size > 10 * 1024 * 1024) { // 10MB limit
     *      event.preventDefault(); // Cancel the upload
     *      alert('File too large');
     *      return;
     *    }
     *
     *    // Async security check
     *    event.detail.waitUntil(
     *      fetch('/api/security/check-upload-permission')
     *        .then(res => res.ok)
     *        .catch(() => false)
     *    );
     *  });
     *
     *  // Example 2: Authorization check before download
     *  viewer.addEventListener('formio:beforeFileDownload', (event) => {
     *    const { fileId } = event.detail;
     *
     *    // Check user permissions
     *    if (!currentUser.canDownloadFiles) {
     *      event.preventDefault();
     *      return;
     *    }
     *
     *    // Async permission check
     *    event.detail.waitUntil(
     *      checkFilePermissions(fileId)
     *    );
     *  });
     *
     *  // Example 3: Confirmation before delete
     *  viewer.addEventListener('formio:beforeFileDelete', (event) => {
     *    const { fileId } = event.detail;
     *
     *    // Show confirmation dialog
     *    const confirmed = confirm('Are you sure you want to delete this file?');
     *    if (!confirmed) {
     *      event.preventDefault();
     *    }
     *  });
     */
    _getSimpleFileComponentOptions() {
      const filesUrl = this._resolveUrl('files');
      return {
        config: {
          uploads: {
            enabled: true,
            fileMinSize: '0KB',
            fileMaxSize: '25MB',
            webcomponents: true,
            url: filesUrl,
          },
        },

        // File operation functions with cancelable events
        uploadFile: async (formData, config = {}) => {
          const proceed = this._emitCancelable('formio:beforeFileUpload', {
            formData,
            config,
            action: 'upload',
          });
          if (!proceed) throw new Error('File upload cancelled');

          const allowed = await this._waitUntil();
          if (!allowed) throw new Error('File upload not allowed');

          return this._handleFileUpload(formData, config);
        },

        getFile: async (fileId, config = {}) => {
          const proceed = this._emitCancelable('formio:beforeFileDownload', {
            fileId,
            config,
            action: 'download',
          });
          if (!proceed) throw new Error('File download cancelled');

          const allowed = await this._waitUntil();
          if (!allowed) throw new Error('File download not allowed');

          return this._handleFileDownload(fileId, config);
        },

        deleteFile: async (fileInfo) => {
          const fileId = fileInfo?.data?.id || fileInfo?.id;
          const proceed = this._emitCancelable('formio:beforeFileDelete', {
            fileInfo,
            fileId,
            action: 'delete',
          });
          if (!proceed) throw new Error('File delete cancelled');

          const allowed = await this._waitUntil();
          if (!allowed) throw new Error('File delete not allowed');

          return this._handleFileDelete(fileInfo);
        },

        // Auth token for file operations (used by simplefile component)
        chefsToken: () =>
          this._buildAuthHeader('')?.['X-Chefs-Gateway-Token'] || '',
      };
    }

    /**
     * Creates the BCAddress component options configuration
     * @returns {Object} BCAddress component configuration
     * @private
     */
    _getBCAddressComponentOptions() {
      const geoApiUrl = this._resolveUrl('bcgeoaddress');
      return {
        providerOptions: {
          queryProperty: 'addressString',
          url: geoApiUrl,
        },
        // Pass shadow root for proper DOM attachment
        shadowRoot: this._root === this.shadowRoot ? this.shadowRoot : null,
      };
    }

    /** Build Form.io options object with all configuration */
    _buildFormioOptions() {
      return {
        readOnly: this.readOnly,
        language: this.language,
        sanitizeConfig: {
          addTags: ['iframe'],
          ALLOWED_TAGS: ['iframe'],
        },
        hooks: this._buildHooks(),
        evalContext: {
          ...(this.token && { token: this.token }),
          ...(this.user && { user: this.user }),
        },
        componentOptions: {
          simplefile: this._getSimpleFileComponentOptions(),
          bcaddress: this._getBCAddressComponentOptions(),
          simplebcaddress: this._getBCAddressComponentOptions(),
          simpleaddressadvanced: {
            shadowRoot: this._root === this.shadowRoot ? this.shadowRoot : null,
          },
        },
        shadowRoot: this._root === this.shadowRoot ? this.shadowRoot : null,
      };
    }

    /**
     * Unified prefill data loader - handles all data fetching
     * Called once during initialization, stores result for later use
     */
    async _loadPrefillData() {
      if (!this.submissionId) {
        this._prefillData = null;
        return;
      }

      const readUrl = this._resolveUrl('readSubmission');

      try {
        const authHeaders = this._buildAuthHeader(readUrl);
        const response = await fetch(readUrl, {
          headers: this._mergeHeadersWithAuth({}, authHeaders, readUrl),
        });
        if (!response.ok) {
          this._log.warn('Prefill data fetch error', {
            status: response.status,
          });
          this._prefillData = null;
          return;
        }

        const data = await response.json();
        const { data: parsedData } = this._verifyAndParseSubmissionData(data);
        this._prefillData = parsedData;
        this._log.info('Prefill data loaded', { hasData: !!parsedData });
      } catch (error) {
        this._log.warn('Prefill data fetch error', { error: error.message });
        this._prefillData = null;
      }
    }

    /**
     * Verifies and parses submission data payload
     * Logs a warning if the payload is invalid (e.g., array)
     * @param {Object} payload - Backend response JSON
     * @returns {Object} { data: Object|null }
     * @private
     */
    _verifyAndParseSubmissionData(payload) {
      try {
        return FormViewerUtils.parseSubmissionData(payload);
      } catch (err) {
        this._log.warn('Invalid submission payload', {
          error: err.message,
          payload,
        });
        return { data: null };
      }
    }

    /**
     * Verifies and parses schema payload
     * Logs a warning if the payload is invalid
     * @param {Object} payload - Backend response JSON
     * @returns {Object} { form, schema }
     * @private
     */
    _verifyAndParseSchema(payload) {
      try {
        return FormViewerUtils.parseSchemaPayload(payload);
      } catch (err) {
        this._log.warn('Invalid schema payload', {
          error: err.message,
          payload,
        });
        return { form: null, schema: null };
      }
    }

    /**
     * Unified prefill application - single, robust strategy
     * Called after Form.io instance is ready
     */
    async _applyPrefill() {
      if (!this._prefillData || !this.formioInstance) return;

      // Single application with comprehensive approach
      try {
        // Method 1: Use Form.io's native setSubmission (preferred)
        if (typeof this.formioInstance.setSubmission === 'function') {
          await this.formioInstance.setSubmission(
            {
              data: this._prefillData,
            },
            {
              fromSubmission: true,
              noValidate: true,
            }
          );
          this._log.info('Prefill applied via setSubmission');
          return;
        }

        // Method 2: Direct assignment + redraw (fallback)
        const mergedData = FormViewerUtils.mergePrefillData(
          this.formioInstance.data,
          this._prefillData
        );
        this.formioInstance.submission = { data: this._prefillData };
        this.formioInstance.data = mergedData;

        if (typeof this.formioInstance.redraw === 'function') {
          await this.formioInstance.redraw();
        }

        this._log.info('Prefill applied via direct assignment');
      } catch (error) {
        this._log.warn('Prefill application failed', { error: error.message });
      }
    }

    /**
     * Setup prefill flow - coordinates loading and application
     * Single entry point for all prefill logic
     */
    async _setupPrefill() {
      // Load data early (can be done during schema loading)
      await this._loadPrefillData();

      // Apply after instance is ready
      if (this.formioInstance) {
        await this._applyPrefill();

        // Single retry after first render (if data wasn't applied)
        if (this._prefillData) {
          this.formioInstance.once('render', () => {
            const currentData = this.formioInstance.submission?.data || {};
            const isApplied = FormViewerUtils.isPrefillDataApplied(
              currentData,
              this._prefillData
            );

            if (!isApplied) {
              this._log.info('Retrying prefill after render');
              this._applyPrefill();
            }
          });
        }
      }
    }

    _overrideGlobalAutocompleter() {
      // Save original autocompleter if it exists
      if (globalThis.autocompleter && !globalThis._originalAutocompleter) {
        globalThis._originalAutocompleter = globalThis.autocompleter;
      }

      // Override global autocompleter to prevent Form.io from creating body autocompleters
      globalThis.autocompleter = (settings) => {
        this._log.debug(
          'Global autocompleter called, blocking for Shadow DOM components',
          {
            input: settings?.input?.tagName,
            inputId: settings?.input?.id,
            container: settings?.container?.tagName,
          }
        );

        // Check if this is being called for a BCAddress component in Shadow DOM
        const input = settings?.input;
        if (input && this.shadowRoot && this.shadowRoot.contains(input)) {
          this._log.debug('Blocking autocompleter for Shadow DOM input');
          return null; // Block autocompleter creation for Shadow DOM inputs
        }

        // For non-Shadow DOM inputs, allow original autocompleter (shouldn't happen in web component)
        if (globalThis._originalAutocompleter) {
          this._log.debug('Allowing autocompleter for non-Shadow DOM input');
          return globalThis._originalAutocompleter(settings);
        }

        this._log.debug('No original autocompleter found, blocking all');
        return null;
      };

      this._log.debug('Global autocompleter override installed');
    }

    async _initFormio() {
      await this._ensureAssets();

      // Register auth plugin once - no retry logic needed
      this._registerAuthPlugin();

      // Initialize auth token refresh if we have a token
      await this._initAuthTokenRefresh();

      // Load prefill data early (parallel with other setup)
      const prefillPromise = this._loadPrefillData();

      const container = this._root.querySelector('#formio-container');
      if (!container) throw new Error('Form container not found');

      const options = this._buildFormioOptions();

      // Wait for prefill data to be loaded
      await prefillPromise;

      // beforeInit interception
      const proceed = this._emitCancelable('formio:beforeInit', { options });
      if (!proceed || !(await this._waitUntil())) return;

      // CRITICAL: Override global autocompleter to prevent Form.io from creating body autocompleters
      this._overrideGlobalAutocompleter();

      // Create Form.io instance
      this.formioInstance = await this._createFormioInstance(
        container,
        this.formSchema,
        options
      );

      // Setup instance configuration (simplified - no prefill complexity)
      this._configureInstanceEndpoints();
      this._wireInstanceEvents();

      // now Apply prefill in one shot
      await this._applyPrefill();

      this._log.info('ready', { formId: this.formId });
    }

    render() {
      const isolationCss =
        this.isolateStyles && this._root === this.shadowRoot
          ? `
        /* Minimize inheritance from the page into the shadow tree */
        :host { all: initial; display: block; }
        /* Establish explicit baseline that children will inherit */
        .container { 
          all: revert; 
          font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; 
          font-size: 14px; 
          line-height: 1.4; 
          color: #111; 
        }
      `
          : `
        :host { display: block; }
      `;

      this._root.innerHTML = `
          <style>
            ${isolationCss}
            
            /* CSS variables and Shadow DOM fixes are provided by chefs-theme.css */
            
            /* Form control background safety override */
            .form-control {
              background-color: #fff !important;
              color: #212529 !important;
            }
            
            /* All other styles are loaded from chefs-index.css and chefs-theme.css */
          </style>
          
          <!-- Replicate CHEFS structure exactly: div#app > v-layout > v-main > v-container.main > v-skeleton-loader > v-container--fluid > form-wrapper -->
          <div class="v-application" id="app">
            <div class="v-layout app">
              <main class="v-main app">
                <div class="v-container v-locale--is-ltr main">
                  <div class="v-skeleton-loader">
                    <div class="v-container v-container--fluid v-locale--is-ltr">
                      <div>
                        <div class="form-wrapper">
                          <div id="formio-container"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
          <div id="bcaddress-autocomplete-container"></div>
        `;
    }
  }

  customElements.define('chefs-form-viewer', ChefsFormViewer);
})();
