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
   * - Set `window.CHEFS_VIEWER_DEBUG = true` before the element is connected.
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
     * @param {Object} location - window.location-like object
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
    createBasicAuthHeader(username, password, encoder = window.btoa) {
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
            .replace(new RegExp(`/:${key}\\b`, 'g'), `/${value}`)
            .replace(new RegExp(`:${key}\\b`, 'g'), value);
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
      Object.entries(attrs).forEach(([k, v]) => {
        el.setAttribute(k, v);
      });
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
  };

  window.FormViewerUtils = FormViewerUtils;
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
   *     api-key="YOUR_API_KEY"
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
   * - api-key (string): required. Used with form-id for same-origin Basic auth.
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
   *   el.apiKey = '...';
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
   *       b) _registerAuthPlugin()
   *       c) _loadPrefillData() (parallel with setup)
   *       d) Build Form.io options (readOnly, language, hooks)
   *       e) Emit `formio:beforeInit` (cancelable with waitUntil)
   *       f) Create Form.io instance; _configureInstanceEndpoints()
   *       g) _applyPrefill() with single, robust strategy
   *       h) _wireInstanceEvents(); log `ready`
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
  class ChefsFormViewer extends HTMLElement {
    static get observedAttributes() {
      return [
        'form-id',
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
      ];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });

      // State
      this.formId = null;
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

      // Asset loading state machine
      this._assetState = 'IDLE';
      this._assetErrors = [];
      this._loadedAssets = new Map();

      // Endpoint overrides via property
      // object is { mainCss, formioJs, componentsJs, themeCss, schema, submit, readSubmission, iconsCss }
      this.endpoints = null;

      // Optional: custom auth header hook
      this.onBuildAuthHeader = null; // (url) => ({ Authorization: '...' })

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
     * - api-key: string; pairs with form-id to generate Basic auth for same-origin requests.
     * - submission-id: string; when set, the component will prefetch and apply submission data.
     * - read-only: boolean; passes readOnly to Form.io to disable editing.
     * - language: string; i18n language code (default "en").
     * - base-url: string; overrides autodetected base (e.g., https://myhost.com/app or https://myhost.com  /pr-####).
     * - debug: boolean; enables the internal logger (also via window.CHEFS_VIEWER_DEBUG).
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
     */
    attributeChangedCallback(name, _ov, nv) {
      switch (name) {
        case 'form-id':
          this.formId = nv;
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
        const globalDebug = window.CHEFS_VIEWER_DEBUG === true;
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
     * @fires ChefsFormViewer#formio:error - If submission fails
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
      return FormViewerUtils.parseBaseUrl(window.location);
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
        readSubmission: `${base}/api/v1/submissions/${sid}`,
      };
    }

    _urls() {
      const d = this._defaultEndpoints();
      const u = { ...d, ...(this.endpoints || {}) };
      return u;
    }

    _authHeader(url) {
      if (typeof this.onBuildAuthHeader === 'function') {
        const h = this.onBuildAuthHeader(url);
        if (h && typeof h === 'object') return h;
      }
      // Default Basic: formId:apiKey
      if (url.startsWith(this.getBaseUrl())) {
        try {
          return FormViewerUtils.createBasicAuthHeader(
            this.formId,
            this.apiKey
          );
        } catch (e) {
          this._log.warn('Failed to create Basic Auth header', {
            error: e.message,
          });
          return {};
        }
      }
      return {};
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
      await this._manualSubmit({ data: currentData });
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
        window,
        'Formio',
        ['createForm']
      );

      if (hasCreateForm) {
        return window.Formio.createForm(container, schema, options);
      }
      return new window.Formio.Form(container, schema, options);
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

      const res = await fetch(url, { headers: this._authHeader(url) });
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
        window,
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
      const formioStatus = FormViewerUtils.validateFormioGlobal(window);
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
          () => FormViewerUtils.validateFormioGlobal(window).hasCreateForm
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

    /** Register a minimal auth plugin to attach auth headers to CHEFS requests */
    _registerAuthPlugin() {
      const formioAvailable = FormViewerUtils.validateGlobalMethods(
        window,
        'Formio',
        ['registerPlugin']
      );
      if (!formioAvailable || window.__formioWcAuth) return;
      const base = this.getBaseUrl();
      const authHeader = this._authHeader(base);
      // debug: auth plugin register
      const plugin = {
        priority: 0,
        preRequest: (args) => {
          if (!args?.url?.startsWith(base)) return;
          args.opts = args.opts || {};
          args.opts.headers = { ...(args.opts.headers || {}), ...authHeader };
        },
        preStaticRequest: (args) => {
          if (!args?.url?.startsWith(base)) return;
          args.opts = args.opts || {};
          args.opts.headers = { ...(args.opts.headers || {}), ...authHeader };
        },
      };
      window.Formio.registerPlugin(plugin, 'chefs-viewer-auth');
      window.__chefsViewerAuth = true;
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
    async _manualSubmit(submission) {
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
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this._authHeader(url),
        },
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
      return !results.some((r) => r === false);
    }

    /** Build Form.io options object with all configuration */
    _buildFormioOptions() {
      return {
        readOnly: this.readOnly,
        language: this.language,
        sanitizeConfig: {},
        hooks: this._buildHooks(),
        evalContext: {
          ...(this.token && { token: this.token }),
          ...(this.user && { user: this.user }),
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
        const response = await fetch(readUrl, {
          headers: this._authHeader(readUrl),
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

    async _initFormio() {
      await this._ensureAssets();
      this._registerAuthPlugin();

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
        `;
    }
  }

  customElements.define('chefs-form-viewer', ChefsFormViewer);
})();
