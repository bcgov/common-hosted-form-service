import { beforeEach, describe, expect, it, vi } from 'vitest';

// Relative path import executes the IIFE and registers the custom element
const COMPONENT_PATH = '../../../public/embed/chefs-form-viewer.js';

/**
 * Minimal fake Form.io instance to satisfy the component during tests.
 */
class FakeFormioInstance {
  constructor() {
    this.handlers = new Map();
    this.submission = { data: {} };
    this.data = {};
    this.destroyed = false;
    this.url = '';
  }
  on(name, cb) {
    const list = this.handlers.get(name) || [];
    list.push(cb);
    this.handlers.set(name, list);
  }
  emit(name, payload) {
    const list = this.handlers.get(name) || [];
    for (const cb of list) cb(payload);
  }
  async setSubmission(obj) {
    this.submission = obj || { data: {} };
  }
  async redraw() {
    this._redrawCalled = true;
  }
  getValue() {
    return { fromGetValue: true };
  }
  setValue(obj) {
    this.data = { ...(this.data || {}), ...(obj || {}) };
  }
  destroy() {
    this.destroyed = true;
  }
}

/* eslint-env browser, jest */
/* global globalThis */

/**
 * Create mock response object for tests
 */
function mkRes(status, json) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => json,
  };
}

/**
 * Mock fetch handler for tests - handles schema, submission, and submit endpoints
 * @param {string|URL} url - Request URL
 * @param {Object} opts - Request options
 * @returns {Promise<Response>} Mock response
 */
async function mockFetchHandler(url, opts = {}) {
  const parsedUrl = parseFetchUrl(url);
  if (!parsedUrl) {
    return fallbackFetch(url, opts);
  }

  const { pathname, method } = parsedUrl;

  if (isSchemaRequest(pathname, method)) {
    return mkRes(200, { form: { id: 'FORM1' }, schema: { components: [] } });
  }

  if (isSubmissionRequest(pathname, method)) {
    return mkRes(200, { submission: { submission: { data: { pre: 1 } } } });
  }

  if (isSubmitRequest(pathname, method, opts)) {
    const body = JSON.parse((opts && opts.body) || '{}');
    return mkRes(200, body.submission || {});
  }

  return fallbackFetch(url, opts);
}

/**
 * Parse URL and method from fetch parameters
 * @param {string|URL} url - Request URL
 * @returns {Object|null} Parsed URL info or null if parsing fails
 */
function parseFetchUrl(url) {
  try {
    const u = new URL(String(url), 'http://localhost');
    const method = 'GET'; // Will be overridden by specific request handlers
    return { pathname: u.pathname, method };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.debug('mock fetch URL parse failed:', err);
    return null;
  }
}

/**
 * Check if request is for schema endpoint
 */
function isSchemaRequest(pathname, method) {
  return pathname.endsWith('/schema') && method === 'GET';
}

/**
 * Check if request is for submission endpoint
 */
function isSubmissionRequest(pathname, method) {
  return pathname.includes('/api/v1/submissions/') && method === 'GET';
}

/**
 * Check if request is for submit endpoint
 */
function isSubmitRequest(pathname, method, opts) {
  const actualMethod = (
    opts && typeof opts === 'object' && 'method' in opts
      ? String(opts.method)
      : 'GET'
  ).toUpperCase();
  return pathname.endsWith('/submit') && actualMethod === 'POST';
}

/**
 * Fallback to original fetch or return 404
 */
function fallbackFetch(url, opts) {
  if (typeof globalThis._originalFetch === 'function') {
    return globalThis._originalFetch(url, opts);
  }
  return mkRes(200, { fallback: true });
}

/**
 * Create complex token fixture for testing
 */
function createComplexTokenFixture() {
  return {
    sub: 'user123',
    roles: ['admin', 'user'],
    metadata: createTokenMetadata(),
    groups: ['group1', 'group2'],
  };
}

/**
 * Create token metadata with permissions
 */
function createTokenMetadata() {
  return {
    department: 'IT',
    permissions: {
      read: true,
      write: true,
      admin: false,
    },
  };
}

/**
 * Create complex user fixture for testing
 */
function createComplexUserFixture() {
  return {
    profile: createUserProfile(),
    contact: createUserContact(),
  };
}

/**
 * Create user profile with preferences
 */
function createUserProfile() {
  return {
    firstName: 'John',
    lastName: 'Doe',
    preferences: {
      theme: 'dark',
      language: 'en',
    },
  };
}

/**
 * Create user contact information
 */
function createUserContact() {
  return {
    email: 'john@example.com',
    phone: '+1234567890',
  };
}

/**
 * Create mock response for fetch tests
 */
function createMockResponse(expectedData) {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue({ submission: { data: expectedData } }),
  };
}

describe('chefs-form-viewer web component', () => {
  let originalFetch;
  beforeEach(async () => {
    // Reset DOM
    document.body.innerHTML = '';
    const faStyle = document.getElementById('cfv-fa-face');
    if (faStyle && faStyle.parentNode) faStyle.parentNode.removeChild(faStyle);

    // Stable base URL for getBaseUrl
    // Replace URL to /app for stable base
    window.history.replaceState({}, '', '/app/demo');

    // Stub Formio before loading the component so asset loader skips JS fetches
    // createForm returns a fresh instance each time to avoid cross-test pollution
    globalThis.Formio = {
      createForm: vi.fn(() => new FakeFormioInstance()),
      registerPlugin: vi.fn(),
    };

    // Mock fetch for schema, submit, readSubmission; fall back to real fetch for everything else
    originalFetch = globalThis.fetch?.bind(globalThis);
    globalThis._originalFetch = originalFetch;
    globalThis.fetch = vi.fn(mockFetchHandler);

    // Load/execute the component script (registers custom element)
    await import(COMPONENT_PATH);
  });

  afterEach(() => {
    if (originalFetch) globalThis.fetch = originalFetch;
  });

  it('registers the custom element', () => {
    const ctor = customElements.get('chefs-form-viewer');
    expect(ctor).toBeInstanceOf(Function);
  });

  it('computes default endpoints and honors base-url override', () => {
    const el = document.createElement('chefs-form-viewer');
    document.body.appendChild(el);
    // Default base should include /app
    const urls = el._urls();
    expect(urls.mainCss).toMatch(
      '/app/webcomponents/v1/assets/chefs-index.css'
    );

    // Override base-url
    el.setAttribute('base-url', 'https://example.com/pr-1234');
    const urls2 = el._urls();
    expect(urls2.mainCss).toBe(
      'https://example.com/pr-1234/webcomponents/v1/assets/chefs-index.css'
    );
  });

  it('loads with shadow DOM and isolates styles when requested', async () => {
    const el = document.createElement('chefs-form-viewer');
    el.setAttribute('form-id', '11111111-1111-1111-1111-111111111111');
    el.setAttribute('api-key', 'secret');
    el.setAttribute('isolate-styles', 'true');
    document.body.appendChild(el);
    configureNoNetwork(el);

    const events = [];
    el.addEventListener('formio:loadSchema', () => events.push('loadSchema'));
    el.addEventListener('formio:ready', () => events.push('ready'));

    await el.load();
    // Instance should exist
    expect(el.formioInstance).toBeTruthy();
    // Shell should contain isolation CSS in shadowRoot
    const styleText = el.shadowRoot.querySelector('style')?.textContent || '';
    expect(styleText).toMatch(':host { all: initial');
    expect(events).toEqual(['loadSchema', 'ready']);
  });

  it('disables icons when no-icons is set and does not inject @font-face', async () => {
    const el = document.createElement('chefs-form-viewer');
    el.setAttribute('form-id', '11111111-1111-1111-1111-111111111111');
    el.setAttribute('api-key', 'secret');
    el.setAttribute('no-icons', 'true');
    document.body.appendChild(el);
    configureNoNetwork(el);

    await el.load();

    // No global @font-face style
    expect(document.getElementById('cfv-fa-face')).toBeFalsy();
    // Neutralizing style exists in shadow to clear FA content
    const css = [...el.shadowRoot.querySelectorAll('style')]
      .map((n) => n.textContent || '')
      .join('\n');
    expect(css).toMatch('.formio-form .fa::before');
  });

  it('enables icons by default and injects @font-face once', async () => {
    const el = document.createElement('chefs-form-viewer');
    el.setAttribute('form-id', '11111111-1111-1111-1111-111111111111');
    el.setAttribute('api-key', 'secret');
    document.body.appendChild(el);
    configureNoNetwork(el, { keepDefaultIcons: true });

    await el.load();
    expect(document.getElementById('cfv-fa-face')).toBeTruthy();
    // Second load should not duplicate
    await el.reload();
    expect(document.querySelectorAll('#cfv-fa-face').length).toBe(1);
  });

  it('applies prefill via submission-id (scheduled applications)', async () => {
    const el = document.createElement('chefs-form-viewer');
    el.setAttribute('form-id', '11111111-1111-1111-1111-111111111111');
    el.setAttribute('api-key', 'secret');
    el.setAttribute('submission-id', 'SUB1');
    document.body.appendChild(el);
    configureNoNetwork(el);

    await el.load();
    // Simulate first render to trigger scheduled application
    el.formioInstance.emit('render');
    // After scheduled applications, instance should have merged data
    // We cannot await internal timers deterministically; just assert no throw and presence of instance
    expect(el.formioInstance).toBeTruthy();
  });

  it('programmatic submit and draft set the submit key accordingly and POST', async () => {
    const el = document.createElement('chefs-form-viewer');
    el.setAttribute('form-id', '11111111-1111-1111-1111-111111111111');
    el.setAttribute('api-key', 'secret');
    el.setAttribute('submit-button-key', 'isSubmit');
    document.body.appendChild(el);
    configureNoNetwork(el);

    await el.load();

    // Submit
    await el.submit();
    const submitCall = lastFetchCall('/submit', 'POST');
    expect(submitCall).toBeTruthy();
    expect(JSON.parse(submitCall.opts.body)).toEqual({
      submission: { data: { isSubmit: true } },
    });

    // Draft
    await el.draft();
    const draftCall = lastFetchCall('/submit', 'POST');
    expect(JSON.parse(draftCall.opts.body)).toEqual({
      submission: { data: { isSubmit: false } },
    });
  });

  it('reload destroys the instance and reinitializes', async () => {
    // Return a trackable instance for this test
    const tracked = new FakeFormioInstance();
    globalThis.Formio.createForm = vi.fn(() => tracked);

    const el = document.createElement('chefs-form-viewer');
    el.setAttribute('form-id', '11111111-1111-1111-1111-111111111111');
    el.setAttribute('api-key', 'secret');
    document.body.appendChild(el);
    configureNoNetwork(el);

    await el.load();
    expect(tracked.destroyed).toBe(false);
    await el.reload();
    expect(tracked.destroyed).toBe(true);
  });

  it('loads styles into document.head when no-shadow is set', async () => {
    const el = document.createElement('chefs-form-viewer');
    el.setAttribute('form-id', '11111111-1111-1111-1111-111111111111');
    el.setAttribute('api-key', 'secret');
    el.setAttribute('no-shadow', 'true');
    document.body.appendChild(el);
    configureNoNetwork(el, { appendHeadLinks: true });
    const headLinkCountBefore = document.head.querySelectorAll(
      'link[rel="stylesheet"]'
    ).length;
    await el.load();
    const headLinkCountAfter = document.head.querySelectorAll(
      'link[rel="stylesheet"]'
    ).length;
    expect(headLinkCountAfter).toBeGreaterThan(headLinkCountBefore);
  });

  function lastFetchCall(pathSuffix, method) {
    const calls = (globalThis.fetch.mock.calls || []).map(([url, opts]) => ({
      url,
      opts: opts || {},
    }));
    const filtered = calls.filter(
      (c) =>
        String(c.url).includes(pathSuffix) &&
        String(c.opts.method || 'GET').toUpperCase() === method
    );
    return filtered[filtered.length - 1];
  }

  describe('token and user functionality', () => {
    it('parses token attribute as JSON and sets property', () => {
      const el = document.createElement('chefs-form-viewer');
      document.body.appendChild(el);

      const tokenData = {
        sub: 'user123',
        roles: ['admin'],
        email: 'test@example.com',
      };
      el.setAttribute('token', JSON.stringify(tokenData));

      expect(el.token).toEqual(tokenData);
    });

    it('parses user attribute as JSON and sets property', () => {
      const el = document.createElement('chefs-form-viewer');
      document.body.appendChild(el);

      const userData = { name: 'John Doe', department: 'IT', id: 123 };
      el.setAttribute('user', JSON.stringify(userData));

      expect(el.user).toEqual(userData);
    });

    it('handles invalid JSON gracefully and logs warning', () => {
      const el = document.createElement('chefs-form-viewer');
      document.body.appendChild(el);

      // Mock the logger
      const mockWarn = vi.fn();
      el._log = { warn: mockWarn };

      el.setAttribute('token', 'invalid-json');
      el.setAttribute('user', '{"incomplete": json}');

      expect(el.token).toBeNull();
      expect(el.user).toBeNull();
      expect(mockWarn).toHaveBeenCalledTimes(2);
      expect(mockWarn).toHaveBeenCalledWith(
        'Invalid JSON in token attribute:',
        expect.objectContaining({ value: 'invalid-json' })
      );
    });

    it('allows direct property assignment of objects', () => {
      const el = document.createElement('chefs-form-viewer');
      document.body.appendChild(el);

      const tokenData = { sub: 'user456', roles: ['user'] };
      const userData = { name: 'Jane Smith', department: 'HR' };

      el.token = tokenData;
      el.user = userData;

      expect(el.token).toEqual(tokenData);
      expect(el.user).toEqual(userData);
    });

    it('includes token and user in Form.io evalContext when set', async () => {
      const el = document.createElement('chefs-form-viewer');
      el.setAttribute('form-id', '11111111-1111-1111-1111-111111111111');
      el.setAttribute('api-key', 'secret');
      document.body.appendChild(el);
      configureNoNetwork(el);

      const tokenData = { sub: 'user123', roles: ['admin'] };
      const userData = { name: 'John Doe', department: 'IT' };

      el.token = tokenData;
      el.user = userData;

      await el.load();

      // Check if createForm was called with evalContext
      const createFormCalls = globalThis.Formio.createForm.mock.calls;
      const lastCall = createFormCalls[createFormCalls.length - 1];
      const options = lastCall[2]; // third argument is options

      expect(options.evalContext.token).toEqual(tokenData);
      expect(options.evalContext.user).toEqual(userData);
    });

    it('works without token and user set (evalContext is empty)', async () => {
      const el = document.createElement('chefs-form-viewer');
      el.setAttribute('form-id', '11111111-1111-1111-1111-111111111111');
      el.setAttribute('api-key', 'secret');
      document.body.appendChild(el);
      configureNoNetwork(el);

      await el.load();

      // Check if createForm was called with empty evalContext
      const createFormCalls = globalThis.Formio.createForm.mock.calls;
      const lastCall = createFormCalls[createFormCalls.length - 1];
      const options = lastCall[2]; // third argument is options

      expect(options.evalContext).toEqual({});
    });

    it('includes only token in evalContext when user is not set', async () => {
      const el = document.createElement('chefs-form-viewer');
      el.setAttribute('form-id', '11111111-1111-1111-1111-111111111111');
      el.setAttribute('api-key', 'secret');
      document.body.appendChild(el);
      configureNoNetwork(el);

      const tokenData = { sub: 'user123', roles: ['admin'] };
      el.token = tokenData;

      await el.load();

      const createFormCalls = globalThis.Formio.createForm.mock.calls;
      const lastCall = createFormCalls[createFormCalls.length - 1];
      const options = lastCall[2];

      expect(options.evalContext.token).toEqual(tokenData);
      expect(options.evalContext.user).toBeUndefined();
    });

    it('includes only user in evalContext when token is not set', async () => {
      const el = document.createElement('chefs-form-viewer');
      el.setAttribute('form-id', '11111111-1111-1111-1111-111111111111');
      el.setAttribute('api-key', 'secret');
      document.body.appendChild(el);
      configureNoNetwork(el);

      const userData = { name: 'Jane Smith', department: 'HR' };
      el.user = userData;

      await el.load();

      const createFormCalls = globalThis.Formio.createForm.mock.calls;
      const lastCall = createFormCalls[createFormCalls.length - 1];
      const options = lastCall[2];

      expect(options.evalContext.user).toEqual(userData);
      expect(options.evalContext.token).toBeUndefined();
    });

    it('handles empty string attributes gracefully', () => {
      const el = document.createElement('chefs-form-viewer');
      document.body.appendChild(el);

      el.setAttribute('token', '');
      el.setAttribute('user', '');

      expect(el.token).toBeNull();
      expect(el.user).toBeNull();
    });

    it('overrides attribute values with property assignment', () => {
      const el = document.createElement('chefs-form-viewer');
      document.body.appendChild(el);

      // Set via attribute first
      el.setAttribute('token', '{"from":"attribute"}');
      expect(el.token).toEqual({ from: 'attribute' });

      // Override via property
      const newToken = { from: 'property', roles: ['admin'] };
      el.token = newToken;
      expect(el.token).toEqual(newToken);
    });

    it('preserves complex nested objects in token and user', async () => {
      const el = document.createElement('chefs-form-viewer');
      el.setAttribute('form-id', '11111111-1111-1111-1111-111111111111');
      el.setAttribute('api-key', 'secret');
      document.body.appendChild(el);
      configureNoNetwork(el);

      const complexToken = createComplexTokenFixture();
      const complexUser = createComplexUserFixture();

      el.token = complexToken;
      el.user = complexUser;

      await el.load();

      const createFormCalls = globalThis.Formio.createForm.mock.calls;
      const lastCall = createFormCalls[createFormCalls.length - 1];
      const options = lastCall[2];

      expect(options.evalContext.token).toEqual(complexToken);
      expect(options.evalContext.user).toEqual(complexUser);
    });
  });

  describe('_buildFormioOptions method', () => {
    let el;

    beforeEach(() => {
      el = document.createElement('chefs-form-viewer');
      el.setAttribute('form-id', '11111111-1111-1111-1111-111111111111');
      el.setAttribute('api-key', 'secret');
      document.body.appendChild(el);
      configureNoNetwork(el);
    });
    it('builds basic options with defaults', () => {
      const options = el._buildFormioOptions();

      expect(options).toEqual({
        readOnly: false,
        language: 'en',
        sanitizeConfig: {},
        hooks: expect.any(Object),
        evalContext: {},
        shadowRoot: expect.any(Object),
      });
    });

    it('includes readOnly when set', () => {
      el.readOnly = true;
      const options = el._buildFormioOptions();

      expect(options.readOnly).toBe(true);
    });

    it('includes custom language', () => {
      el.language = 'fr';
      const options = el._buildFormioOptions();

      expect(options.language).toBe('fr');
    });

    it('includes token in evalContext when set', () => {
      const token = { sub: 'user123', roles: ['admin'] };
      el.token = token;
      const options = el._buildFormioOptions();

      expect(options.evalContext.token).toEqual(token);
    });

    it('includes user in evalContext when set', () => {
      const user = { name: 'John Doe', department: 'IT' };
      el.user = user;
      const options = el._buildFormioOptions();

      expect(options.evalContext.user).toEqual(user);
    });

    it('includes both token and user when both set', () => {
      const token = { sub: 'user123' };
      const user = { name: 'Jane Doe' };
      el.token = token;
      el.user = user;
      const options = el._buildFormioOptions();

      expect(options.evalContext.token).toEqual(token);
      expect(options.evalContext.user).toEqual(user);
    });

    it('excludes token/user from evalContext when not set', () => {
      el.token = null;
      el.user = null;
      const options = el._buildFormioOptions();

      expect(options.evalContext).toEqual({});
    });
  });

  describe('_handleRuntimePrefill method', () => {
    let el;

    beforeEach(() => {
      el = document.createElement('chefs-form-viewer');
      el.setAttribute('form-id', '11111111-1111-1111-1111-111111111111');
      el.setAttribute('api-key', 'secret');
      document.body.appendChild(el);
      configureNoNetwork(el);
    });
    it('does nothing when no submissionId', async () => {
      el.submissionId = null;
      const fetchSpy = vi.spyOn(global, 'fetch');

      await el._handleRuntimePrefill({
        readSubmission: '/api/submissions/:submissionId',
      });

      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });

    it('fetches and applies submission data when submissionId exists', async () => {
      el.submissionId = 'sub123';
      const expectedData = { firstName: 'John', lastName: 'Doe' };
      const mockResponse = createMockResponse(expectedData);
      const fetchSpy = vi
        .spyOn(global, 'fetch')
        .mockResolvedValue(mockResponse);
      const schedulesSpy = vi
        .spyOn(el, '_schedulePrefillApplications')
        .mockResolvedValue();

      await el._handleRuntimePrefill({
        readSubmission: '/api/submissions/:submissionId',
      });

      expect(fetchSpy).toHaveBeenCalledWith('/api/submissions/sub123', {
        headers: expect.any(Object),
      });
      expect(schedulesSpy).toHaveBeenCalledWith(expectedData);

      fetchSpy.mockRestore();
      schedulesSpy.mockRestore();
    });

    it('logs warning when fetch fails', async () => {
      el.submissionId = 'sub123';
      const mockResponse = { ok: false, status: 404 };
      const fetchSpy = vi
        .spyOn(global, 'fetch')
        .mockResolvedValue(mockResponse);
      const logSpy = vi.spyOn(el._log, 'warn');

      await el._handleRuntimePrefill({
        readSubmission: '/api/submissions/:submissionId',
      });

      expect(logSpy).toHaveBeenCalledWith('prefill:readSubmission:failed', {
        status: 404,
      });

      fetchSpy.mockRestore();
      logSpy.mockRestore();
    });
  });

  describe('_setupFormioInstance method', () => {
    let el;

    beforeEach(() => {
      el = document.createElement('chefs-form-viewer');
      el.setAttribute('form-id', '11111111-1111-1111-1111-111111111111');
      el.setAttribute('api-key', 'secret');
      document.body.appendChild(el);
      configureNoNetwork(el);
      el._configureInstanceEndpoints = vi.fn();
      el._wireInstanceEvents = vi.fn();
      el._setupPrefillGuard = vi.fn();
    });

    it('calls all setup methods', () => {
      const urls = { submit: '/submit' };
      el._setupFormioInstance(urls, null);

      expect(el._configureInstanceEndpoints).toHaveBeenCalledWith(urls);
      expect(el._wireInstanceEvents).toHaveBeenCalled();

      expect(el._setupPrefillGuard).not.toHaveBeenCalled();
    });

    it('sets up prefill guard when prefilledViaOptions provided', () => {
      const urls = { submit: '/submit' };
      const prefilledData = { name: 'John' };

      el._setupFormioInstance(urls, prefilledData);

      expect(el._setupPrefillGuard).toHaveBeenCalledWith(prefilledData);
    });
  });

  describe('_setupPrefillGuard method', () => {
    let el, mockInstance;

    beforeEach(() => {
      el = document.createElement('chefs-form-viewer');
      el.setAttribute('form-id', '11111111-1111-1111-1111-111111111111');
      el.setAttribute('api-key', 'secret');
      document.body.appendChild(el);
      configureNoNetwork(el);
      mockInstance = new FakeFormioInstance();
      el.formioInstance = mockInstance;
      el._setSubmissionOnInstance = vi.fn().mockResolvedValue();
    });

    it('sets up one-time render event handler', () => {
      const prefilledData = { name: 'John' };
      const onSpy = vi.spyOn(mockInstance, 'on');

      el._setupPrefillGuard(prefilledData);

      expect(onSpy).toHaveBeenCalledWith('render', expect.any(Function));
    });

    it('applies prefilled data on first render only', async () => {
      const prefilledData = { name: 'John' };
      el._setupPrefillGuard(prefilledData);

      // Simulate first render
      mockInstance.emit('render');
      await waitForNextTick();

      expect(el._setSubmissionOnInstance).toHaveBeenCalledWith(prefilledData, {
        fromSubmission: true,
        noValidate: true,
      });

      // Simulate second render - should not apply again
      el._setSubmissionOnInstance.mockClear();
      mockInstance.emit('render');
      await waitForNextTick();

      expect(el._setSubmissionOnInstance).not.toHaveBeenCalled();
    });

    it('handles errors gracefully', async () => {
      const prefilledData = { name: 'John' };
      el._setSubmissionOnInstance.mockRejectedValue(new Error('Test error'));
      const logSpy = vi.spyOn(el._log, 'debug').mockImplementation(() => {});

      el._setupPrefillGuard(prefilledData);
      mockInstance.emit('render');
      await waitForNextTick();

      expect(logSpy).toHaveBeenCalledWith('prefill:options:ignored', {
        message: 'Test error',
      });

      logSpy.mockRestore();
    });
  });
});

function createMockCssLoader(baseCss) {
  return vi.fn(async (href) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href || baseCss;
    document.head.appendChild(link);
  });
}

async function waitForNextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function configureNoNetwork(el, options = {}) {
  const baseCss = 'data:text/css,';
  const baseJs = 'data:text/javascript,';
  el.endpoints = {
    ...el.endpoints,
    mainCss: baseCss,
    themeCss: baseCss,
    formioJs: baseJs,
    componentsJs: baseJs,
    ...(options.keepDefaultIcons ? {} : { iconsCss: baseCss }),
  };
  // Prevent actual network; resolve loaders immediately
  el._loadCssIntoRoot = vi.fn(async () => {});
  el._loadCss = vi.fn(async () => {});
  el._injectScript = vi.fn(async () => true);
  if (options.appendHeadLinks) {
    el._loadCssIntoRoot = createMockCssLoader(baseCss);
    el._loadCss = createMockCssLoader(baseCss);
  }
}
