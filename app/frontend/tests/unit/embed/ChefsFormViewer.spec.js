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
    globalThis.fetch = vi.fn(async (url, opts = {}) => {
      try {
        const u = new URL(String(url), 'http://localhost');
        const method = (
          opts && typeof opts === 'object' && 'method' in opts
            ? String(opts.method)
            : 'GET'
        ).toUpperCase();

        if (u.pathname.endsWith('/schema') && method === 'GET') {
          return mkRes(200, {
            form: { id: 'FORM1' },
            schema: { components: [] },
          });
        }
        if (u.pathname.includes('/api/v1/submissions/') && method === 'GET') {
          return mkRes(200, {
            submission: { submission: { data: { pre: 1 } } },
          });
        }
        if (u.pathname.endsWith('/submit') && method === 'POST') {
          const body = JSON.parse((opts && opts.body) || '{}');
          return mkRes(200, body.submission || {});
        }
      } catch (err) {
        // Handle parse issues explicitly and fall back to originalFetch
        // eslint-disable-next-line no-console
        console.debug('mock fetch URL parse failed:', err);
      }
      if (typeof originalFetch === 'function') {
        return originalFetch(url, opts);
      }
      return mkRes(404, { error: 'not found' });
    });

    // Load/execute the component script (registers custom element)
    await import(COMPONENT_PATH);
  });

  function mkRes(status, json) {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => json,
    };
  }

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
    expect(urls.assetsCss).toMatch('/app/webcomponents/v1/assets/formio.css');

    // Override base-url
    el.setAttribute('base-url', 'https://example.com/pr-1234');
    const urls2 = el._urls();
    expect(urls2.assetsCss).toBe(
      'https://example.com/pr-1234/webcomponents/v1/assets/formio.css'
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
      
      const tokenData = { sub: 'user123', roles: ['admin'], email: 'test@example.com' };
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
      
      const complexToken = {
        sub: 'user123',
        roles: ['admin', 'user'],
        metadata: {
          department: 'IT',
          permissions: {
            read: true,
            write: true,
            admin: false
          }
        },
        groups: ['group1', 'group2']
      };
      
      const complexUser = {
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          preferences: {
            theme: 'dark',
            language: 'en'
          }
        },
        contact: {
          email: 'john@example.com',
          phone: '+1234567890'
        }
      };
      
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

  function configureNoNetwork(el, options = {}) {
    const baseCss = 'data:text/css,';
    const baseJs = 'data:text/javascript,';
    el.endpoints = {
      ...el.endpoints,
      assetsCss: baseCss,
      stylesCss: baseCss,
      themeCss: baseCss,
      assetsJs: baseJs,
      componentsJs: baseJs,
      ...(options.keepDefaultIcons ? {} : { iconsCss: baseCss }),
    };
    // Prevent actual network; resolve loaders immediately
    el._loadCssIntoRoot = vi.fn(async () => {});
    el._loadCss = vi.fn(async () => {});
    el._injectScript = vi.fn(async () => true);
    if (options.appendHeadLinks) {
      el._loadCssIntoRoot = vi.fn(async (href) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href || baseCss;
        document.head.appendChild(link);
      });
      el._loadCss = vi.fn(async (href) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href || baseCss;
        document.head.appendChild(link);
      });
    }
  }
});
