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
   * - Set el.endpoints = { assetsCss, assetsJs, componentsJs, stylesCss, themeCss, schema, submit, readSubmission, iconsCss }
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
   *       a) _ensureAssets() in order: assetsCss → iconsCss → assetsJs → stylesCss → themeCss → preload/@font-face → componentsJs
   *       b) _registerAuthPlugin()
   *       c) Build Form.io options (readOnly, language, hooks)
   *       d) _prefetchSubmissionForOptions() (if `submission-id`) to seed options
   *       e) Emit `formio:beforeInit` (cancelable with waitUntil)
   *       f) Create Form.io instance; _configureInstanceEndpoints()
   *       g) Apply/enforce prefill; or fetch and schedule prefill after render
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
      this._isLoading = false;
      this.submitButtonKey = 'submit';
      this.themeCss = null; // optional theme CSS loaded after stylesCss
      this.isolateStyles = false; // optional isolation of inherited outside styles
      this.noIcons = false; // optional flag to disable loading icon CSS
      this.token = null; // optional token object for Form.io evalContext
      this.user = null; // optional user object for Form.io evalContext

      // Endpoint overrides via property
      // object is { assetsCss, assetsJs, componentsJs, stylesCss, schema, submit, readSubmission }
      this.endpoints = null;

      // Optional: custom auth header hook
      this.onBuildAuthHeader = null; // (url) => ({ Authorization: '...' })

      /**
       * Overrideable parsers for backend payloads (CHEFS-compatible defaults)
       *
       * Why override?
       * - If your backend returns different JSON shapes than CHEFS, you can adapt them here
       *   without forking the component. This keeps integration glue localized and testable.
       *
       * How to override (before calling load()):
       *   const el = document.querySelector('chefs-form-viewer');
       *   el.parsers = {
       *     ...el.parsers,
       *     schema: (json) => ({ form: json.meta, schema: json.payload }),
       *     readSubmission: (json) => ({ data: json.result?.data || null }),
       *     submitResult: (json) => ({ submission: json }),
       *     error: (json) => json?.errorMessage || null,
       *   };
       *   el.load();
       *
       * Expected return shapes:
       * - schema(json) -> { form, schema }
       *   form: original form metadata (optional), schema: Form.io schema object
       * - readSubmission(json) -> { data }
       *   data: plain object to merge into Form.io submission { data }
       * - submitResult(json) -> { submission }
       *   submission: any value you want emitted as formio:submitDone.detail.submission
       * - error(json) -> string | null
       *   returns a user-facing error message extracted from backend error payload
       */
      this.parsers = {
        schema: (json) => ({
          form: json?.form || json,
          schema: json?.schema || json?.form?.versions?.[0]?.schema || json,
        }),
        readSubmission: (json) => {
          // CHEFS default: { submission: { ..., submission: { data: {...} } } }
          const candidates = [
            json?.submission?.submission?.data,
            json?.submission?.data,
            json?.data,
            json?.submission?.submission,
            json?.submission,
          ];
          const pick = candidates.find(
            (v) => v && (typeof v !== 'object' || Object.keys(v).length > 0)
          );
          if (pick) {
            if (
              typeof pick === 'object' &&
              typeof pick.data === 'object' &&
              Object.keys(pick.data || {}).length > 0
            ) {
              return { data: pick.data };
            }
            return { data: pick };
          }
          // Fallback: deep search for a non-empty "data" object anywhere
          const stack = [json];
          const seen = new Set();
          while (stack.length) {
            const cur = stack.shift();
            if (!cur || typeof cur !== 'object' || seen.has(cur)) continue;
            seen.add(cur);
            if (
              cur.data &&
              typeof cur.data === 'object' &&
              Object.keys(cur.data).length > 0
            ) {
              return { data: cur.data };
            }
            for (const v of Object.values(cur)) stack.push(v);
          }
          return { data: null };
        },
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
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch (err) {
        this._log.warn(`Invalid JSON in ${attributeName} attribute:`, {
          value,
          error: err.message,
        });
        return null;
      }
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
      if (this._isLoading) {
        this._log.info('load:skip:already-loading');
        return;
      }
      this._isLoading = true;
      this._log.info('load:begin', { formId: this.formId });
      this._emit(
        'formio:beforeLoad',
        { formId: this.formId },
        { cancelable: true }
      );
      try {
        await this._loadSchema();
        await this._initFormio();
        this._emit('formio:ready', { form: this.form });
        this._log.info('load:done');
      } finally {
        this._isLoading = false;
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
      await this._programmaticSubmit(true);
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
      await this._programmaticSubmit(false);
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
      const { origin, pathname } = window.location;
      const match = pathname.match(/^\/(app|pr-\d+)\b/);
      const baseSegment = match ? `/${match[1]}` : '/app';
      const url = `${origin}${baseSegment}`;
      // debug: getBaseUrl
      return url;
    }

    /** Default backend endpoints; embedders can override via .endpoints */
    _defaultEndpoints() {
      const base = this.getBaseUrl();
      const fid = this.formId || ':formId';
      const sid = this.submissionId || ':submissionId';
      return {
        assetsCss: `${base}/webcomponents/v1/assets/formio.css`,
        assetsJs: `${base}/webcomponents/v1/assets/formio.js`,
        componentsJs: `${base}/webcomponents/v1/form-viewer/components`,
        stylesCss: `${base}/webcomponents/v1/form-viewer/styles`,
        themeCss: `${base}/webcomponents/v1/form-viewer/theme`,
        // Default to local Font Awesome 4.7 for Form.io icon classes (fa fa-*)
        // Served by backend to ensure fonts load in Shadow DOM without CORS/CSP issues.
        // Embedders can override via endpoints.iconsCss, or disable via 'no-icons'.
        iconsCss: `${base}/webcomponents/v1/assets/font-awesome/css/font-awesome.min.css`,
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
      if (this.formId && this.apiKey && url.startsWith(this.getBaseUrl())) {
        const basicToken = btoa(`${this.formId}:${this.apiKey}`);
        return {
          Authorization: `Basic ${basicToken}`,
        };
      }
      return {};
    }

    _getSubmitButtonKey() {
      return this.submitButtonKey || 'submit';
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

    /** Prefetch submission and seed into options to reduce flicker */
    async _prefetchSubmissionForOptions(options) {
      if (!this.submissionId) return null;
      const urls = this._urls();
      const result = await this._fetchPrefillData(urls);
      if (!result.ok) {
        this._log.warn('prefill(options):readSubmission:failed', {
          status: result.status,
        });
        return null;
      }
      if (result.dataToApply && typeof result.dataToApply === 'object') {
        options.submission = { data: result.dataToApply };
        return result.dataToApply;
      }
      return null;
    }

    async _createFormioInstance(container, schema, options) {
      if (typeof window.Formio?.createForm === 'function') {
        return window.Formio.createForm(container, schema, options);
      }
      return new window.Formio.Form(container, schema, options);
    }

    _configureInstanceEndpoints(urls) {
      this.formioInstance.url = urls.submit.replace(
        '/:formId',
        `/${this.formId}`
      );
    }

    async _parseError(res, fallback) {
      const errJson = await res.json().catch(() => null);
      return this.parsers.error(errJson) || fallback;
    }

    async _fetchPrefillData(urls) {
      if (!this.submissionId)
        return { ok: false, readUrl: null, dataToApply: null };
      const readUrl = urls.readSubmission.replace(
        '/:submissionId',
        `/${this.submissionId}`
      );
      const res = await fetch(readUrl, { headers: this._authHeader(readUrl) });
      if (!res.ok)
        return { ok: false, status: res.status, readUrl, dataToApply: null };
      const data = await res.json().catch(() => ({}));
      const { data: dataToApply } = this.parsers.readSubmission(data);
      return { ok: true, readUrl, dataToApply };
    }

    _loadCss(href) {
      return new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = resolve;
        document.head.appendChild(link);
      });
    }

    /** Preload FA fonts when using default iconsCss */
    _preloadFontAwesomeFontsIfDefault(urls) {
      const isDefaultIcons =
        !this.endpoints?.iconsCss || this.endpoints.iconsCss === urls.iconsCss;
      if (!isDefaultIcons) return;
      const base = this.getBaseUrl();
      // Preload only woff2 to avoid "preloaded but not used" warnings for legacy formats
      const href = `${base}/webcomponents/v1/assets/font-awesome/fonts/fontawesome-webfont.woff2?v=4.7.0`;
      if (
        !document.querySelector(
          `link[rel="preload"][as="font"][href="${href}"]`
        )
      ) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.href = href;
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    }

    /**
     * Register a global @font-face for Font Awesome when using the default iconsCss
     *
     * Why
     * - In Shadow DOM, even with a <link rel="stylesheet"> inside the shadow root, some browsers may not
     *   consistently initiate font requests for glyphs (e.g., ::before content) until a matching @font-face
     *   is known at the document level. By defining @font-face in document.head we ensure the font-family
     *   'FontAwesome' is globally registered, so when the shadow CSS requests it, the browser loads it.
     * - We serve the font files from same-origin routes to avoid CSP/CORS issues that can block font loads.
     *
     * What style is added
     * - A single @font-face rule for 'FontAwesome' with woff2/woff/ttf sources and font-display:swap:
     *   @font-face {
     *     font-family: 'FontAwesome';
     *     src: url('<base>/.../fontawesome-webfont.woff2?v=4.7.0') format('woff2'),
     *          url('<base>/.../fontawesome-webfont.woff?v=4.7.0') format('woff'),
     *          url('<base>/.../fontawesome-webfont.ttf?v=4.7.0') format('truetype');
     *     font-weight: normal;
     *     font-style: normal;
     *     font-display: swap;
     *   }
     *
     * Note
     * - Separately, in _ensureAssets() we also inject a tiny style in the shadow root to make FA icons
     *   inherit the button text color (color: currentColor). That is not part of this method.
     */
    _ensureFontAwesomeFaceIfDefault(urls) {
      const isDefaultIcons =
        !this.endpoints?.iconsCss || this.endpoints.iconsCss === urls.iconsCss;
      if (!isDefaultIcons) return;
      const styleId = 'cfv-fa-face';
      if (document.getElementById(styleId)) return;
      const base = this.getBaseUrl();
      const woff2 = `${base}/webcomponents/v1/assets/font-awesome/fonts/fontawesome-webfont.woff2?v=4.7.0`;
      const woff = `${base}/webcomponents/v1/assets/font-awesome/fonts/fontawesome-webfont.woff?v=4.7.0`;
      const ttf = `${base}/webcomponents/v1/assets/font-awesome/fonts/fontawesome-webfont.ttf?v=4.7.0`;
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `@font-face{font-family:'FontAwesome';src:url('${woff2}') format('woff2'),url('${woff}') format('woff'),url('${ttf}') format('truetype');font-weight:normal;font-style:normal;font-display:swap;}`;
      document.head.appendChild(style);
    }

    /** Load a stylesheet into shadow or document head preserving URL resolution */
    async _loadCssIntoRoot(href) {
      if (!href) return;
      // If rendering into light DOM (no-shadow), use document head link tag
      if (this._root !== this.shadowRoot) {
        await this._loadCss(href);
        return;
      }
      // Shadow DOM: attach a <link rel="stylesheet"> directly to the shadow root.
      // This preserves correct URL resolution (e.g., @import, url(...)) and avoids CORS issues with fetch.
      await new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = resolve; // non-blocking
        this.shadowRoot.appendChild(link);
      });
    }

    _injectScript(src) {
      return new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.head.appendChild(s);
      });
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

    /** Ensure prefilled data remains after initial render */
    async _enforcePrefillAfterInit(prefilledData) {
      if (!prefilledData) return;
      try {
        await this._setSubmissionOnInstance(prefilledData, {
          fromSubmission: true,
          noValidate: true,
        });
      } catch (err) {
        this._log?.debug?.('prefill:afterInit:ignored', {
          message: err?.message || String(err),
        });
      }
    }

    /**
     * Apply prefill data to the live Form.io instance
     *
     * When
     * - Invoked by `_schedulePrefillApplications` immediately, on next tick, and after first render
     * - Used after fetching a submission during init when options seeding wasn’t applied
     *
     * Why
     * - Different Form.io versions/components can override or delay state; multiple applications reduce
     *   races and ensure the UI reflects the intended prefill. We merge into instance state and call
     *   `setValue` when available for maximal effect without relying on a single code path.
     */
    async _applyPrefillData(dataToApply) {
      if (!dataToApply) return;
      await this._setSubmissionOnInstance(dataToApply);
      try {
        this.formioInstance.data = {
          ...(this.formioInstance.data || {}),
          ...dataToApply,
        };
        if (typeof this.formioInstance?.setValue === 'function') {
          this.formioInstance.setValue(dataToApply);
        }
      } catch (err) {
        this._log?.debug?.('prefill:apply:ignored', {
          message: err?.message || String(err),
        });
      }
      this._log.info('prefill:applied');
    }

    /** Apply immediately, on next tick, and after first render to reduce races */
    async _schedulePrefillApplications(dataToApply) {
      await this._applyPrefillData(dataToApply);
      setTimeout(() => {
        this._applyPrefillData(dataToApply).catch(() => {});
      }, 0);
      let appliedAfterRender = false;
      this.formioInstance.on('render', async () => {
        if (appliedAfterRender) return;
        appliedAfterRender = true;
        await this._applyPrefillData(dataToApply);
      });
    }

    /**
     * Fetch and schedule prefill after the Form.io instance has been created
     *
     * When
     * - Called during initialization if a `submission-id` is present and we did not already seed prefill
     *   data via options (i.e., prefilledViaOptions is falsy). This handles cases where options seeding
     *   wasn't possible/timely but prefill is still desired.
     *
     * Why
     * - Some versions/flows need the instance to exist before reliably applying prefill. We fetch the
     *   submission and use `_schedulePrefillApplications` to apply immediately, on the next tick, and once
     *   after the first render. This reduces visual flicker and race conditions across component setups.
     */
    async _applyPrefillAfterInit(urls) {
      if (!this.submissionId) return;
      const result = await this._fetchPrefillData(urls);
      if (!result.ok) {
        this._log.warn('prefill:readSubmission:failed', {
          status: result.status,
        });
        return;
      }
      await this._schedulePrefillApplications(result.dataToApply);
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
      const urls = this._urls();
      const url = urls.schema;
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

    /** Load assets in a deterministic order to avoid race conditions */
    async _ensureAssets() {
      const urls = this._urls();
      this._log.info('assets:ensure');
      // CSS
      await this._loadCssIntoRoot(urls.assetsCss);
      // Icon font CSS (Font Awesome) unless disabled
      const iconsEnabled = !this.noIcons;
      const iconsHref = iconsEnabled
        ? this.endpoints?.iconsCss || urls.iconsCss
        : null;
      if (iconsHref) {
        await this._loadCssIntoRoot(iconsHref);
      }
      // JS
      const haveFormio = !!window.Formio;
      if (!haveFormio) {
        const loadedLocal = await this._injectScript(urls.assetsJs);
        if (!loadedLocal) {
          await this._injectScript(
            'https://cdn.form.io/formiojs/formio.full.min.js'
          );
        }
      }
      // Optional styles/components
      await this._loadCssIntoRoot(urls.stylesCss);
      // Optional theme CSS (BCGov or other), loaded after stylesCss
      const themeHref =
        this.themeCss || this.endpoints?.themeCss || urls.themeCss;
      if (themeHref) {
        await this._loadCssIntoRoot(themeHref);
      }
      if (iconsEnabled) {
        // Preload FA fonts if using default iconsCss (avoid if embedder overrides)
        this._preloadFontAwesomeFontsIfDefault(urls);
        // Register @font-face for FA when using default iconsCss so glyphs render
        this._ensureFontAwesomeFaceIfDefault(urls);
        // Minimal icon color fix: make Font Awesome icons inherit button text color
        if (this._root === this.shadowRoot) {
          const iconStyle = document.createElement('style');
          iconStyle.textContent = `
            .formio-form .btn .fa,
            .formio-form .btn [class*="fa-"] {
              color: currentColor !important;
              -webkit-text-fill-color: currentColor !important;
            }
          `;
          this.shadowRoot.appendChild(iconStyle);
        }
      } else if (this._root === this.shadowRoot) {
        // Explicitly neutralize FA icons if disabled, in case base CSS defines FA classes/content
        const noIconStyle = document.createElement('style');
        noIconStyle.textContent = `
          .formio-form .fa,
          .formio-form [class*="fa-"] {
            font-family: inherit !important;
          }
          .formio-form .fa::before,
          .formio-form [class*="fa-"]::before {
            content: '' !important;
          }
        `;
        this.shadowRoot.appendChild(noIconStyle);
      }
      // No additional refine layer needed; theme is final override
      await this._injectScript(urls.componentsJs);
    }

    /** Register a minimal auth plugin to attach auth headers to CHEFS requests */
    _registerAuthPlugin() {
      if (!window.Formio || window.__formioWcAuth) return;
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

      const urls = this._urls();
      const url = urls.submit.replace('/:formId', `/${this.formId}`);
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

    async _initFormio() {
      await this._ensureAssets();
      this._registerAuthPlugin();

      const container = this._root.querySelector('#formio-container');
      if (!container) throw new Error('Form container not found');

      const options = {
        readOnly: this.readOnly,
        language: this.language,
        sanitizeConfig: {},
        hooks: this._buildHooks(),
        evalContext: {
          ...(this.token && { token: this.token }),
          ...(this.user && { user: this.user }),
        },
      };

      // Prefetch submission and seed into options (if available)
      const prefilledViaOptions = await this._prefetchSubmissionForOptions(
        options
      );

      // beforeInit interception
      const proceed = this._emitCancelable('formio:beforeInit', { options });
      if (!proceed || !(await this._waitUntil())) return;

      // Create instance
      if (typeof window.Formio?.createForm === 'function') {
        this.formioInstance = await window.Formio.createForm(
          container,
          this.formSchema,
          options
        );
      } else {
        this.formioInstance = new window.Formio.Form(
          container,
          this.formSchema,
          options
        );
      }

      // Configure endpoints
      const urls = this._urls();
      this._configureInstanceEndpoints(urls);
      // Enforce prefill if we seeded via options, else apply via runtime fetch
      if (prefilledViaOptions)
        await this._enforcePrefillAfterInit(prefilledViaOptions);

      // Preload submission if provided (apply immediately and once after first render)
      if (this.submissionId && !prefilledViaOptions) {
        const readUrl = urls.readSubmission.replace(
          '/:submissionId',
          `/${this.submissionId}`
        );
        const res = await fetch(readUrl, {
          headers: this._authHeader(readUrl),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const { data: dataToApply } = this.parsers.readSubmission(data);
          await this._schedulePrefillApplications(dataToApply);
        } else {
          this._log.warn('prefill:readSubmission:failed', {
            status: res.status,
          });
        }
      }

      // Wire events
      this._wireInstanceEvents();

      // If we had prefilled data via options, re-apply once after first render as a final guard
      if (prefilledViaOptions) {
        let applied = false;
        this.formioInstance.on('render', async () => {
          if (applied) return;
          applied = true;
          try {
            await this._setSubmissionOnInstance(prefilledViaOptions, {
              fromSubmission: true,
              noValidate: true,
            });
          } catch (err) {
            this._log?.debug?.('prefill:options:ignored', {
              message: err?.message || String(err),
            });
          }
        });
      }

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
            .container { padding: 1rem; }
          </style>
          <div class="container">
            <div id="formio-container"></div>
          </div>
        `;
    }
  }

  customElements.define('chefs-form-viewer', ChefsFormViewer);
})();
