/* eslint-disable no-undef */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the component script to register the custom element and expose FormViewerUtils
const COMPONENT_PATH = '../../../public/embed/chefs-form-viewer.js';

// --- Pure Utility Tests ---
describe('FormViewerUtils', () => {
  let utils;
  beforeAll(async () => {
    await import(COMPONENT_PATH);
    utils = globalThis.FormViewerUtils;
  });

  it('validateAssetUrl throws for invalid URLs and passes for valid ones', () => {
    const { validateAssetUrl } = globalThis.FormViewerUtils;
    // Valid JS and CSS URLs
    expect(() => validateAssetUrl('https://x/foo.js', 'js')).not.toThrow();
    expect(() => validateAssetUrl('https://x/bar.css', 'css')).not.toThrow();
    // Invalid: missing, not string, wrong protocol
    expect(() => validateAssetUrl('', 'js')).toThrow(
      /Malformed or missing JS URL/
    );
    expect(() => validateAssetUrl(null, 'css')).toThrow(
      /Malformed or missing CSS URL/
    );
    expect(() => validateAssetUrl(undefined, 'js')).toThrow(
      /Malformed or missing JS URL/
    );
    expect(() => validateAssetUrl(123, 'css')).toThrow(
      /Malformed or missing CSS URL/
    );
    expect(() => validateAssetUrl('ftp://x/foo.js', 'js')).toThrow(
      /Malformed or missing JS URL/
    );
    expect(() => validateAssetUrl('bar', 'css')).toThrow(
      /Malformed or missing CSS URL/
    );
    // Valid: http/https only
    expect(() => validateAssetUrl('https://x/foo', 'js')).not.toThrow();
    expect(() => validateAssetUrl('https://x/bar', 'css')).not.toThrow();
  });
  it('parseBaseUrl returns correct base', () => {
    expect(
      utils.parseBaseUrl({ origin: 'https://x', pathname: '/app/foo' })
    ).toBe('https://x/app');
    expect(
      utils.parseBaseUrl({ origin: 'https://x', pathname: '/pr-123/foo' })
    ).toBe('https://x/pr-123');
    expect(
      utils.parseBaseUrl({ origin: 'https://x', pathname: '/other' })
    ).toBe('https://x/app');
  });

  it('parseBaseUrl handles empty and missing values', () => {
    expect(utils.parseBaseUrl({ origin: '', pathname: '' })).toBe('/app');
    expect(utils.parseBaseUrl({})).toBe('undefined/app');
    expect(utils.parseBaseUrl({ origin: 'https://x', pathname: '/' })).toBe(
      'https://x/app'
    );
    expect(utils.parseBaseUrl({ origin: 'https://x', pathname: '/app/' })).toBe(
      'https://x/app'
    );
    expect(
      utils.parseBaseUrl({ origin: 'https://x', pathname: '/app?foo=bar' })
    ).toBe('https://x/app');
  });

  it('createBasicAuthHeader returns correct header', () => {
    globalThis.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
    expect(utils.createBasicAuthHeader('abc', 'def')).toEqual({
      Authorization: `Basic ${btoa('abc:def')}`,
    });
    expect(utils.createBasicAuthHeader('', 'def')).toEqual({});
    expect(utils.createBasicAuthHeader('abc', '')).toEqual({});
  });

  it('createBasicAuthHeader throws for encoder errors, returns {} for non-string', () => {
    expect(utils.createBasicAuthHeader(123, 'def')).toEqual({});
    expect(utils.createBasicAuthHeader('abc', 456)).toEqual({});
    expect(() =>
      utils.createBasicAuthHeader('abc', 'def', () => {
        throw new Error('fail');
      })
    ).toThrow('fail');
  });

  it('safeJsonParse parses valid and invalid JSON', () => {
    expect(utils.safeJsonParse('{"a":1}', 'test')).toEqual({
      success: true,
      data: { a: 1 },
      error: null,
    });
    const result = utils.safeJsonParse('bad', 'test');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Invalid JSON/);
  });

  it('safeJsonParse handles empty, whitespace, and non-string', () => {
    expect(utils.safeJsonParse('', 'test')).toEqual({
      success: true,
      data: null,
      error: null,
    });
    expect(utils.safeJsonParse('   ', 'test')).toEqual({
      success: true,
      data: null,
      error: null,
    });
    expect(utils.safeJsonParse(undefined, 'test')).toEqual({
      success: false,
      data: null,
      error: expect.any(String),
    });
    expect(utils.safeJsonParse(null, 'test')).toEqual({
      success: false,
      data: null,
      error: expect.any(String),
    });
    expect(utils.safeJsonParse(123, 'test')).toEqual({
      success: false,
      data: null,
      error: expect.any(String),
    });
  });

  it('parseSubmissionData extracts data for valid payloads, throws for invalid', () => {
    expect(
      utils.parseSubmissionData({
        submission: { submission: { data: { x: 1 } } },
      })
    ).toEqual({ data: { x: 1 } });
    expect(utils.parseSubmissionData({ data: { y: 2 } })).toEqual({
      data: { y: 2 },
    });
    expect(() => utils.parseSubmissionData({})).toThrow(
      'No valid submission data found in payload'
    );
    expect(() => utils.parseSubmissionData(null)).toThrow(
      'Submission payload must be a non-null object, not array'
    );
    expect(() => utils.parseSubmissionData([])).toThrow(
      'Submission payload must be a non-null object, not array'
    );
    expect(() => utils.parseSubmissionData({ submission: [] })).toThrow(
      'submission property must be a non-null object, not array'
    );
    expect(() =>
      utils.parseSubmissionData({ submission: { submission: [] } })
    ).toThrow(
      'submission.submission property must be a non-null object, not array'
    );
    expect(() => utils.parseSubmissionData({ data: [] })).toThrow(
      'data property must be a non-null object, not array'
    );
  });

  // parseSubmissionData error cases now covered above

  it('validateFormioGlobal returns correct status', () => {
    expect(
      utils.validateFormioGlobal({ Formio: { createForm: () => {} } })
    ).toEqual({ available: true, hasCreateForm: true });
    expect(utils.validateFormioGlobal({})).toEqual({
      available: false,
      hasCreateForm: false,
    });
  });

  it('validateFormioGlobal handles missing and wrong types', () => {
    expect(utils.validateFormioGlobal(null)).toEqual({
      available: false,
      hasCreateForm: false,
    });
    expect(utils.validateFormioGlobal({ Formio: {} })).toEqual({
      available: true,
      hasCreateForm: false,
    });
    expect(
      utils.validateFormioGlobal({ Formio: { createForm: 'notAFunction' } })
    ).toEqual({ available: true, hasCreateForm: false });
  });

  it('generateFontFaceCSS returns CSS string', () => {
    expect(utils.generateFontFaceCSS('https://x')).toMatch(/@font-face/);
  });

  it('generateFontFaceCSS handles empty and malformed baseUrl', () => {
    expect(utils.generateFontFaceCSS('')).toMatch(/@font-face/);
    expect(utils.generateFontFaceCSS(null)).toMatch(/@font-face/);
    expect(utils.generateFontFaceCSS(123)).toMatch(/@font-face/);
  });

  it('generateIconColorCSS returns CSS string', () => {
    expect(utils.generateIconColorCSS()).toMatch(/color:currentColor/);
  });

  it('generateIconNeutralizeCSS returns CSS string', () => {
    expect(utils.generateIconNeutralizeCSS()).toMatch(/font-family:inherit/);
  });

  it('mergePrefillData merges objects', () => {
    expect(utils.mergePrefillData({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
  });

  it('mergePrefillData handles null, undefined, and arrays', () => {
    expect(utils.mergePrefillData(null, { b: 2 })).toEqual({ b: 2 });
    expect(utils.mergePrefillData({ a: 1 }, null)).toEqual({ a: 1 });
    expect(utils.mergePrefillData([1], [2])).toEqual({ 0: 2 });
  });

  it('isPrefillDataApplied checks keys', () => {
    expect(utils.isPrefillDataApplied({ a: 1 }, { a: 1 })).toBe(true);
    expect(utils.isPrefillDataApplied({ a: 1 }, { b: 2 })).toBe(false);
  });

  it('isPrefillDataApplied returns false for empty or non-object', () => {
    expect(utils.isPrefillDataApplied({}, {})).toBe(false);
    expect(utils.isPrefillDataApplied({ a: 1 }, { a: '1' })).toBe(false);
    expect(utils.isPrefillDataApplied(null, { a: 1 })).toBe(false);
    expect(utils.isPrefillDataApplied({ a: 1 }, null)).toBe(false);
    expect(utils.isPrefillDataApplied([], { a: 1 })).toBe(false);
    expect(utils.isPrefillDataApplied({ a: 1 }, [])).toBe(false);
  });

  it('resolveUrl substitutes params', () => {
    const endpoints = { foo: '/x/:formId/:submissionId' };
    expect(
      utils.resolveUrl(endpoints, 'foo', { formId: 'A', submissionId: 'B' })
    ).toBe('/x/A/B');
  });

  it('resolveUrl handles missing keys and params', () => {
    expect(() => utils.resolveUrl({}, 'foo')).toThrow();
    expect(utils.resolveUrl({ foo: '/x/:id' }, 'foo', {})).toBe('/x/:id');
    expect(utils.resolveUrl({ foo: '/x/:id' }, 'foo', { id: null })).toBe(
      '/x/:id'
    );
  });

  it('resolveUrlWithFallback returns both', () => {
    const endpoints = { a: '/a', b: '/b' };
    expect(utils.resolveUrlWithFallback(endpoints, 'a', 'b')).toEqual({
      primary: '/a',
      fallback: '/b',
    });
  });

  it('substituteUrlParams replaces params', () => {
    expect(utils.substituteUrlParams('/x/:id', { id: 'Y' })).toBe('/x/Y');
  });

  it('substituteUrlParams replaces params without leading slash', () => {
    expect(utils.substituteUrlParams(':id', { id: 'Y' })).toBe('Y');
    expect(utils.substituteUrlParams('api/:id', { id: 'Y' })).toBe('api/Y');
  });

  it('createElement creates element with attributes', () => {
    const el = utils.createElement('div', { id: 'foo' }, 'bar');
    expect(el.id).toBe('foo');
    expect(el.textContent).toBe('bar');
  });

  it('createElement throws for empty or non-string tagName', () => {
    expect(() => utils.createElement('', {}, '')).toThrow();
    expect(() => utils.createElement(123, {}, '')).toThrow();
  });

  it('appendElement appends to parent', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    utils.appendElement(child, parent);
    expect(parent.contains(child)).toBe(true);
  });

  it('appendElement handles null parent', () => {
    const el = document.createElement('div');
    expect(() => utils.appendElement(el, null)).not.toThrow();
  });

  it('injectStyle injects style', () => {
    const parent = document.createElement('div');
    const style = utils.injectStyle('body{}', parent, 'test-style');
    expect(style.id).toBe('test-style');
    expect(parent.contains(style)).toBe(true);
  });

  it('injectStyle handles null parent and duplicate id', () => {
    const style = utils.injectStyle('body{}', null, 'test-style');
    expect(style).toBeTruthy();
    const parent = document.createElement('div');
    utils.injectStyle('body{}', parent, 'test-style');
    expect(parent.querySelectorAll('#test-style').length).toBe(1);
  });

  it('validateGlobalMethods checks methods', () => {
    expect(
      utils.validateGlobalMethods({ Foo: { bar: () => {} } }, 'Foo', ['bar'])
    ).toBe(true);
    expect(utils.validateGlobalMethods({ Foo: {} }, 'Foo', ['bar'])).toBe(
      false
    );
  });

  it('validateGlobalMethods handles empty methods and missing property', () => {
    expect(utils.validateGlobalMethods({}, 'Foo', [])).toBe(false);
    expect(utils.validateGlobalMethods({}, 'Bar', ['baz'])).toBe(false);
  });

  it('getJwtExpiry extracts expiry from valid JWT', () => {
    // Valid JWT with exp claim (expires at Unix timestamp 1234567890)
    const validJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjEyMzQ1Njc4OTB9.signature';
    expect(utils.getJwtExpiry(validJwt)).toBe(1234567890);
  });

  it('getJwtExpiry returns null for invalid tokens', () => {
    // Suppress console.error for expected invalid token errors
    // eslint-disable-next-line no-console
    const originalConsoleError = console.error;
    // eslint-disable-next-line no-console
    console.error = vi.fn();

    expect(utils.getJwtExpiry('')).toBe(null);
    expect(utils.getJwtExpiry(null)).toBe(null);
    expect(utils.getJwtExpiry(undefined)).toBe(null);
    expect(utils.getJwtExpiry('not-a-jwt')).toBe(null);
    expect(utils.getJwtExpiry('only.two.parts')).toBe(null);
    expect(utils.getJwtExpiry('too.many.parts.here.invalid')).toBe(null);
    // Invalid base64
    expect(utils.getJwtExpiry('header.invalid-base64.signature')).toBe(null);
    // Valid base64 but invalid JSON
    expect(utils.getJwtExpiry('header.aW52YWxpZC1qc29u.signature')).toBe(null);

    // Restore console.error
    // eslint-disable-next-line no-console
    console.error = originalConsoleError;
  });

  it('getJwtExpiry returns null when no exp claim present', () => {
    // JWT without exp claim
    const noExpJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature';
    expect(utils.getJwtExpiry(noExpJwt)).toBe(null);
    // JWT with non-numeric exp
    const invalidExpJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOiJub3QtYS1udW1iZXIifQ.signature';
    expect(utils.getJwtExpiry(invalidExpJwt)).toBe(null);
  });

  it('secondsUntilExpiry calculates time until expiry', () => {
    const now = Math.floor(Date.now() / 1000);
    const futureExp = now + 3600; // 1 hour from now

    // Mock getJwtExpiry to return our future expiry
    const originalGetJwtExpiry = utils.getJwtExpiry;
    utils.getJwtExpiry = vi.fn().mockReturnValue(futureExp);

    const result = utils.secondsUntilExpiry('mock-token');
    expect(result).toBeGreaterThan(3590); // Should be close to 3600
    expect(result).toBeLessThanOrEqual(3600);

    // Restore original function
    utils.getJwtExpiry = originalGetJwtExpiry;
  });

  it('secondsUntilExpiry returns null for invalid tokens', () => {
    expect(utils.secondsUntilExpiry('')).toBe(null);
    expect(utils.secondsUntilExpiry('invalid-token')).toBe(null);
  });

  it('secondsUntilExpiry returns negative for expired tokens', () => {
    const now = Math.floor(Date.now() / 1000);
    const pastExp = now - 3600; // 1 hour ago

    // Mock getJwtExpiry to return past expiry
    const originalGetJwtExpiry = utils.getJwtExpiry;
    utils.getJwtExpiry = vi.fn().mockReturnValue(pastExp);

    const result = utils.secondsUntilExpiry('mock-token');
    expect(result).toBeLessThan(0);

    // Restore original function
    utils.getJwtExpiry = originalGetJwtExpiry;
  });
});

// --- ChefsFormViewer Public API Tests ---
describe('ChefsFormViewer', () => {
  let el;
  beforeEach(async () => {
    await import(COMPONENT_PATH);
    el = document.createElement('chefs-form-viewer');
    document.body.appendChild(el);
  });
  afterEach(() => {
    if (el && typeof el.remove === 'function') {
      try {
        el.remove();
      } catch (error) {
        // Ignore errors during cleanup - element may already be removed
        // eslint-disable-next-line no-console
        if (process.env.DEBUG) console.warn('Cleanup error:', error);
      }
    }
  });

  it('attributeChangedCallback updates state', () => {
    el.setAttribute('form-id', 'abc');
    expect(el.formId).toBe('abc');
    el.setAttribute('read-only', '');
    expect(el.readOnly).toBe(true);
  });

  it('attributeChangedCallback handles authToken attribute', () => {
    el.setAttribute('auth-token', 'jwt-token-123');
    expect(el.authToken).toBe('jwt-token-123');

    el.setAttribute('api-key', 'api-key-456');
    expect(el.apiKey).toBe('api-key-456');
  });

  it('attributeChangedCallback handles auto-reload-on-submit attribute', () => {
    // Default should be true
    expect(el.autoReloadOnSubmit).toBe(true);

    // Set to false
    el.setAttribute('auto-reload-on-submit', 'false');
    expect(el.autoReloadOnSubmit).toBe(false);

    // Set to true
    el.setAttribute('auto-reload-on-submit', 'true');
    expect(el.autoReloadOnSubmit).toBe(true);

    // Empty string should be true
    el.setAttribute('auto-reload-on-submit', '');
    expect(el.autoReloadOnSubmit).toBe(true);
  });

  it('attributeChangedCallback handles headers attribute', () => {
    const validHeaders =
      '{"X-Custom-Header":"value","Authorization":"Bearer token"}';
    el.setAttribute('headers', validHeaders);
    expect(el.headers).toEqual({
      'X-Custom-Header': 'value',
      Authorization: 'Bearer token',
    });

    // Invalid JSON should set headers to null
    el.setAttribute('headers', 'invalid-json');
    expect(el.headers).toBeNull();
  });

  it('connectedCallback sets logger and renders', () => {
    el.connectedCallback();
    expect(typeof el._log.info).toBe('function');
    expect(el._root).toBe(el.shadowRoot);
  });

  it('getBaseUrl returns correct value', () => {
    el.baseUrl = 'https://x/app';
    expect(el.getBaseUrl()).toBe('https://x/app');
    el.baseUrl = null;
    expect(el.getBaseUrl()).toMatch(/^https?:\/\//);
  });

  it('setSubmission and getSubmission work', () => {
    el.formioInstance = {
      setSubmission: vi.fn(),
      submission: { data: { a: 1 } },
    };
    el.setSubmission({ b: 2 });
    expect(el.formioInstance.setSubmission).toHaveBeenCalledWith({
      data: { b: 2 },
    });
    el.formioInstance = { submission: { data: { a: 1 } } };
    expect(el.getSubmission()).toEqual({ data: { a: 1 } });
  });

  it('destroy nullifies formioInstance', async () => {
    el.formioInstance = { destroy: vi.fn() };
    await el.destroy();
    expect(el.formioInstance).toBeNull();
  });

  it('emit dispatches event', () => {
    const spy = vi.fn();
    el.addEventListener('formio:test', spy);
    el._emit('formio:test', { foo: 1 });
    expect(spy).toHaveBeenCalled();
  });

  // Add more tests for asset loading, hooks, and event emission as needed
});

// --- ChefsFormViewer internals ---
describe('ChefsFormViewer internals', () => {
  let el;
  beforeEach(async () => {
    // Clean up any previous element
    if (el && typeof el.remove === 'function') {
      try {
        el.remove();
      } catch (error) {
        // Ignore cleanup errors - element may already be removed
        // eslint-disable-next-line no-console
        if (process.env.DEBUG) console.warn('Cleanup error:', error);
      }
    }
    el = null;

    await import(COMPONENT_PATH);
    el = document.createElement('chefs-form-viewer');
    document.body.appendChild(el);
    // Always mock fetch for asset loader tests
    globalThis._origFetch = globalThis.fetch;
    globalThis.fetch = vi.fn();
  });
  afterEach(() => {
    if (el && typeof el.remove === 'function') {
      try {
        el.remove();
      } catch (error) {
        // Ignore errors during cleanup - element may already be removed
        // eslint-disable-next-line no-console
        if (process.env.DEBUG) console.warn('Cleanup error:', error);
      }
    }
    // Restore fetch after each test
    if (globalThis._origFetch) {
      globalThis.fetch = globalThis._origFetch;
      delete globalThis._origFetch;
    }
  });

  it('_acquireBusyLock sets and checks busy state, logs and returns false if busy', () => {
    el._isBusy = false;
    const logSpy = vi.spyOn(el._log, 'info');
    expect(el._acquireBusyLock('load')).toBe(true);
    expect(el._isBusy).toBe(true);
    // Try to acquire again, should log and return false
    expect(el._acquireBusyLock('load')).toBe(false);
    expect(logSpy).toHaveBeenCalledWith('load:skip:busy');
    // Reset busy for next test
    el._isBusy = false;
    logSpy.mockRestore();
  });

  it('_releaseBusyLock sets busy to false', () => {
    el._isBusy = true;
    el._releaseBusyLock();
    expect(el._isBusy).toBe(false);
  });

  it('load calls _acquireBusyLock and _releaseBusyLock correctly', async () => {
    const acquireSpy = vi.spyOn(el, '_acquireBusyLock').mockReturnValue(true);
    const releaseSpy = vi.spyOn(el, '_releaseBusyLock');
    el._loadSchema = vi.fn();
    el._initFormio = vi.fn();
    el._emit = vi.fn().mockReturnValue(true);
    el._log.info = vi.fn();
    await el.load();
    expect(acquireSpy).toHaveBeenCalledWith('load');
    expect(releaseSpy).toHaveBeenCalled();
    acquireSpy.mockRestore();
    releaseSpy.mockRestore();
  });

  it('submit calls _acquireBusyLock and _releaseBusyLock correctly', async () => {
    const acquireSpy = vi.spyOn(el, '_acquireBusyLock').mockReturnValue(true);
    const releaseSpy = vi.spyOn(el, '_releaseBusyLock');
    el._programmaticSubmit = vi.fn();
    await el.submit();
    expect(acquireSpy).toHaveBeenCalledWith('submit');
    expect(releaseSpy).toHaveBeenCalled();
    acquireSpy.mockRestore();
    releaseSpy.mockRestore();
  });

  it('submit triggers auto-reload events when enabled', async () => {
    const acquireSpy = vi.spyOn(el, '_acquireBusyLock').mockReturnValue(true);
    const releaseSpy = vi.spyOn(el, '_releaseBusyLock');
    el._programmaticSubmit = vi.fn().mockImplementation(async (isSubmit) => {
      // Simulate successful submission with auto-reload
      if (isSubmit && el.autoReloadOnSubmit) {
        await el._handleAutoReload({ id: 'test-submission' });
      }
    });
    el._handleAutoReload = vi.fn().mockResolvedValue(undefined);

    await el.submit();
    expect(el._programmaticSubmit).toHaveBeenCalledWith(true);
    expect(el._handleAutoReload).toHaveBeenCalledWith({
      id: 'test-submission',
    });

    acquireSpy.mockRestore();
    releaseSpy.mockRestore();
  });

  it('draft calls _acquireBusyLock and _releaseBusyLock correctly', async () => {
    const acquireSpy = vi.spyOn(el, '_acquireBusyLock').mockReturnValue(true);
    const releaseSpy = vi.spyOn(el, '_releaseBusyLock');
    el._programmaticSubmit = vi.fn();
    await el.draft();
    expect(acquireSpy).toHaveBeenCalledWith('draft');
    expect(releaseSpy).toHaveBeenCalled();
    acquireSpy.mockRestore();
    releaseSpy.mockRestore();
  });

  it('draft does not trigger auto-reload even when enabled', async () => {
    const acquireSpy = vi.spyOn(el, '_acquireBusyLock').mockReturnValue(true);
    const releaseSpy = vi.spyOn(el, '_releaseBusyLock');
    el._programmaticSubmit = vi.fn().mockImplementation(async (isSubmit) => {
      // Simulate draft save - should not trigger auto-reload
      if (isSubmit && el.autoReloadOnSubmit) {
        await el._handleAutoReload({ id: 'test-submission' });
      }
    });
    el._handleAutoReload = vi.fn().mockResolvedValue(undefined);

    await el.draft();
    expect(el._programmaticSubmit).toHaveBeenCalledWith(false);
    expect(el._handleAutoReload).not.toHaveBeenCalled();

    acquireSpy.mockRestore();
    releaseSpy.mockRestore();
  });

  it('_buildAuthHeader uses custom hook when provided', () => {
    el.onBuildAuthHeader = (_url) => ({ Authorization: 'Custom' });
    expect(el._buildAuthHeader('https://x')).toEqual({
      Authorization: 'Custom',
    });
  });

  it('_buildAuthHeader prefers Bearer token over Basic auth', () => {
    el.authToken = 'jwt-token-123';
    el.formId = 'form-456';
    el.apiKey = 'api-key-789';
    el.getBaseUrl = () => 'https://example.com';

    const result = el._buildAuthHeader('https://example.com/api');
    expect(result).toEqual({ 'X-Chefs-Gateway-Token': 'jwt-token-123' });
  });

  it('_buildAuthHeader falls back to Basic auth when no authToken', () => {
    el.authToken = null;
    el.formId = 'form-456';
    el.apiKey = 'api-key-789';
    el.getBaseUrl = () => 'https://example.com';

    // Mock btoa for test environment
    globalThis.btoa = (str) => Buffer.from(str, 'binary').toString('base64');

    const result = el._buildAuthHeader('https://example.com/api');
    expect(result).toEqual({
      Authorization: `Basic ${btoa('form-456:api-key-789')}`,
    });
  });

  it('_buildAuthHeader returns empty object for different origin', () => {
    el.authToken = 'jwt-token-123';
    el.getBaseUrl = () => 'https://example.com';

    const result = el._buildAuthHeader('https://other-site.com/api');
    expect(result).toEqual({});
  });

  it('_buildAuthHeader returns empty object when no auth available', () => {
    el.authToken = null;
    el.formId = null;
    el.apiKey = null;
    el.getBaseUrl = () => 'https://example.com';

    const result = el._buildAuthHeader('https://example.com/api');
    expect(result).toEqual({});
  });

  it('_mergeHeadersWithAuth preserves Authorization header from existing headers', () => {
    const existingHeaders = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer host-app-token',
    };
    const authHeaders = { 'X-Chefs-Gateway-Token': 'chefs-token' };

    const result = el._mergeHeadersWithAuth(
      existingHeaders,
      authHeaders,
      'https://example.com/api'
    );

    expect(result).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer host-app-token',
      'X-Chefs-Gateway-Token': 'chefs-token',
    });
  });

  it('_mergeHeadersWithAuth preserves Authorization header case-insensitively', () => {
    const existingHeaders = {
      'content-type': 'application/json',
      authorization: 'Bearer host-app-token',
    };
    const authHeaders = { 'X-Chefs-Gateway-Token': 'chefs-token' };

    const result = el._mergeHeadersWithAuth(
      existingHeaders,
      authHeaders,
      'https://example.com/api'
    );

    expect(result.Authorization || result.authorization).toBe(
      'Bearer host-app-token'
    );
    expect(result['X-Chefs-Gateway-Token']).toBe('chefs-token');
  });

  it('_mergeHeadersWithAuth uses onPassthroughHeaders callback when provided', () => {
    el.onPassthroughHeaders = () => ({
      Authorization: 'Bearer callback-token',
    });
    const existingHeaders = { 'Content-Type': 'application/json' };
    const authHeaders = { 'X-Chefs-Gateway-Token': 'chefs-token' };

    const result = el._mergeHeadersWithAuth(
      existingHeaders,
      authHeaders,
      'https://example.com/api'
    );

    expect(result.Authorization).toBe('Bearer callback-token');
    expect(result['X-Chefs-Gateway-Token']).toBe('chefs-token');
  });

  it('_mergeHeadersWithAuth prefers existing Authorization over callback', () => {
    el.onPassthroughHeaders = () => ({
      Authorization: 'Bearer callback-token',
    });
    const existingHeaders = {
      Authorization: 'Bearer existing-token',
    };
    const authHeaders = { 'X-Chefs-Gateway-Token': 'chefs-token' };

    const result = el._mergeHeadersWithAuth(
      existingHeaders,
      authHeaders,
      'https://example.com/api'
    );

    // Existing header should take precedence
    expect(result.Authorization).toBe('Bearer existing-token');
    expect(result['X-Chefs-Gateway-Token']).toBe('chefs-token');
  });

  it('_mergeHeadersWithAuth blocks X-Chefs-Gateway-Token from passthrough', () => {
    el.onPassthroughHeaders = () => ({
      Authorization: 'Bearer callback-token',
      'X-Chefs-Gateway-Token': 'should-be-blocked',
    });
    const existingHeaders = {};
    const authHeaders = { 'X-Chefs-Gateway-Token': 'chefs-token' };

    const result = el._mergeHeadersWithAuth(
      existingHeaders,
      authHeaders,
      'https://example.com/api'
    );

    expect(result.Authorization).toBe('Bearer callback-token');
    expect(result['X-Chefs-Gateway-Token']).toBe('chefs-token'); // Should use CHEFS auth, not passthrough
  });

  it('_mergeHeadersWithAuth blocks X-Request-ID from passthrough', () => {
    el.onPassthroughHeaders = () => ({
      Authorization: 'Bearer callback-token',
      'X-Request-ID': 'should-be-blocked',
    });
    const existingHeaders = {};
    const authHeaders = { 'X-Chefs-Gateway-Token': 'chefs-token' };

    const result = el._mergeHeadersWithAuth(
      existingHeaders,
      authHeaders,
      'https://example.com/api'
    );

    expect(result.Authorization).toBe('Bearer callback-token');
    expect(result['X-Request-ID']).toBeUndefined();
  });

  it('_mergeHeadersWithAuth blocks x-powered-by from passthrough', () => {
    el.onPassthroughHeaders = () => ({
      Authorization: 'Bearer callback-token',
      'x-powered-by': 'should-be-blocked',
    });
    const existingHeaders = {};
    const authHeaders = { 'X-Chefs-Gateway-Token': 'chefs-token' };

    const result = el._mergeHeadersWithAuth(
      existingHeaders,
      authHeaders,
      'https://example.com/api'
    );

    expect(result.Authorization).toBe('Bearer callback-token');
    expect(result['x-powered-by']).toBeUndefined();
  });

  it('_mergeHeadersWithAuth blocks Authorization Basic from passthrough', () => {
    el.onPassthroughHeaders = () => ({
      Authorization: 'Basic dXNlcjpwYXNz',
    });
    const existingHeaders = {};
    const authHeaders = { 'X-Chefs-Gateway-Token': 'chefs-token' };

    const result = el._mergeHeadersWithAuth(
      existingHeaders,
      authHeaders,
      'https://example.com/api'
    );

    expect(result.Authorization).toBeUndefined(); // Basic auth should be blocked
    expect(result['X-Chefs-Gateway-Token']).toBe('chefs-token');
  });

  it('_mergeHeadersWithAuth allows Authorization Bearer from passthrough', () => {
    el.onPassthroughHeaders = () => ({
      Authorization: 'Bearer allowed-token',
    });
    const existingHeaders = {};
    const authHeaders = { 'X-Chefs-Gateway-Token': 'chefs-token' };

    const result = el._mergeHeadersWithAuth(
      existingHeaders,
      authHeaders,
      'https://example.com/api'
    );

    expect(result.Authorization).toBe('Bearer allowed-token');
    expect(result['X-Chefs-Gateway-Token']).toBe('chefs-token');
  });

  it('_mergeHeadersWithAuth allows custom headers from passthrough', () => {
    el.onPassthroughHeaders = () => ({
      Authorization: 'Bearer callback-token',
      'X-Custom-Header': 'custom-value',
      'X-Request-ID': 'should-be-blocked',
    });
    const existingHeaders = {};
    const authHeaders = { 'X-Chefs-Gateway-Token': 'chefs-token' };

    const result = el._mergeHeadersWithAuth(
      existingHeaders,
      authHeaders,
      'https://example.com/api'
    );

    expect(result.Authorization).toBe('Bearer callback-token');
    expect(result['X-Custom-Header']).toBe('custom-value');
    expect(result['X-Request-ID']).toBeUndefined(); // Should be blocked
  });

  it('_mergeHeadersWithAuth blocks existing Authorization Basic auth', () => {
    el.onPassthroughHeaders = () => ({
      Authorization: 'Bearer callback-token',
    });
    const existingHeaders = {
      Authorization: 'Basic dXNlcjpwYXNz', // Basic auth should be blocked
    };
    const authHeaders = { 'X-Chefs-Gateway-Token': 'chefs-token' };

    const result = el._mergeHeadersWithAuth(
      existingHeaders,
      authHeaders,
      'https://example.com/api'
    );

    // Basic auth from existing headers should be blocked, callback Bearer should be used
    expect(result.Authorization).toBe('Bearer callback-token');
    expect(result['X-Chefs-Gateway-Token']).toBe('chefs-token');
  });

  it('_buildAuthHeader logs error when Basic auth creation fails', () => {
    el.authToken = null;
    el.formId = 'abc';
    el.apiKey = 'def';
    el.getBaseUrl = () => 'https://example.com';

    // Patch createBasicAuthHeader to throw
    const orig = globalThis.FormViewerUtils.createBasicAuthHeader;
    globalThis.FormViewerUtils.createBasicAuthHeader = () => {
      throw new Error('fail');
    };
    const spy = vi.spyOn(el._log, 'warn');

    expect(el._buildAuthHeader('https://example.com/api')).toEqual({});
    expect(spy).toHaveBeenCalledWith(
      'Failed to create Basic Auth header',
      expect.any(Object)
    );

    globalThis.FormViewerUtils.createBasicAuthHeader = orig;
    spy.mockRestore();
  });

  it('refreshAuthToken makes POST request and updates token on success', async () => {
    el.getBaseUrl = () => 'https://example.com';
    el.authToken = 'old-token';
    el._emit = vi.fn();
    el._scheduleNextTokenRefresh = vi.fn();

    // Mock successful response
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: 'new-token' }),
    });

    await el.refreshAuthToken();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://example.com/gateway/v1/auth/refresh',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer old-token',
        },
        body: JSON.stringify({ refreshToken: 'old-token' }),
      }
    );

    expect(el.authToken).toBe('new-token');
    expect(el._emit).toHaveBeenCalledWith('formio:authTokenRefreshed', {
      authToken: 'new-token',
      oldToken: 'old-token',
    });
    expect(el._scheduleNextTokenRefresh).toHaveBeenCalled();
  });

  it('refreshAuthToken emits error on failed response', async () => {
    el.getBaseUrl = () => 'https://example.com';
    el.authToken = 'old-token';
    el._emit = vi.fn();
    el._parseError = vi.fn().mockResolvedValue('Token refresh failed');

    // Mock failed response
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid token' }),
    });

    await el.refreshAuthToken();

    expect(el._emit).toHaveBeenCalledWith('formio:error', {
      error: 'Token refresh failed',
    });
    expect(el.authToken).toBe('old-token'); // Should not change
  });

  it('refreshAuthToken emits error when no token in response', async () => {
    el.getBaseUrl = () => 'https://example.com';
    el.authToken = 'old-token';
    el._emit = vi.fn();

    // Mock response without token
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }), // No token field
    });

    await el.refreshAuthToken();

    expect(el._emit).toHaveBeenCalledWith('formio:error', {
      error: 'No token in refresh response',
    });
  });

  it('refreshAuthToken handles network errors', async () => {
    el.getBaseUrl = () => 'https://example.com';
    el.authToken = 'old-token';
    el._emit = vi.fn();

    // Mock network error
    globalThis.fetch.mockRejectedValueOnce(new Error('Network error'));

    await el.refreshAuthToken();

    expect(el._emit).toHaveBeenCalledWith('formio:error', {
      error: 'Network error',
    });
  });

  it('_scheduleNextTokenRefresh sets timer based on JWT expiry', () => {
    const now = Math.floor(Date.now() / 1000);
    const futureExp = now + 300; // 5 minutes from now

    el.authToken = 'jwt-token';

    // Mock JWT expiry extraction
    const originalGetJwtExpiry = globalThis.FormViewerUtils.getJwtExpiry;
    globalThis.FormViewerUtils.getJwtExpiry = vi
      .fn()
      .mockReturnValue(futureExp);

    // Mock setTimeout to capture the delay
    const originalSetTimeout = globalThis.setTimeout;
    let capturedDelay;
    globalThis.setTimeout = vi.fn((callback, delay) => {
      capturedDelay = delay;
      return 123; // Mock timer ID
    });

    el._scheduleNextTokenRefresh();

    // Should schedule refresh 60 seconds before expiry
    const expectedDelay = (futureExp - now - 60) * 1000;
    expect(capturedDelay).toBe(expectedDelay);
    expect(el._jwtRefreshTimer).toBe(123);

    // Restore mocks
    globalThis.FormViewerUtils.getJwtExpiry = originalGetJwtExpiry;
    globalThis.setTimeout = originalSetTimeout;
  });

  it('_scheduleNextTokenRefresh uses minimum 10 second delay', () => {
    const now = Math.floor(Date.now() / 1000);
    const soonExp = now + 5; // 5 seconds from now (less than 60 second buffer)

    el.authToken = 'jwt-token';

    // Mock JWT expiry extraction
    const originalGetJwtExpiry = globalThis.FormViewerUtils.getJwtExpiry;
    globalThis.FormViewerUtils.getJwtExpiry = vi.fn().mockReturnValue(soonExp);

    // Mock setTimeout to capture the delay
    const originalSetTimeout = globalThis.setTimeout;
    let capturedDelay;
    globalThis.setTimeout = vi.fn((callback, delay) => {
      capturedDelay = delay;
      return 123;
    });

    el._scheduleNextTokenRefresh();

    // Should use minimum 10 second delay
    expect(capturedDelay).toBe(10000);

    // Restore mocks
    globalThis.FormViewerUtils.getJwtExpiry = originalGetJwtExpiry;
    globalThis.setTimeout = originalSetTimeout;
  });

  it('_scheduleNextTokenRefresh clears existing timer', () => {
    el.authToken = 'jwt-token';
    el._jwtRefreshTimer = 456; // Existing timer

    // Mock clearTimeout
    const originalClearTimeout = globalThis.clearTimeout;
    globalThis.clearTimeout = vi.fn();

    // Mock getJwtExpiry to return null (invalid token)
    const originalGetJwtExpiry = globalThis.FormViewerUtils.getJwtExpiry;
    globalThis.FormViewerUtils.getJwtExpiry = vi.fn().mockReturnValue(null);

    el._scheduleNextTokenRefresh();

    expect(globalThis.clearTimeout).toHaveBeenCalledWith(456);
    expect(el._jwtRefreshTimer).toBe(null);

    // Restore mocks
    globalThis.FormViewerUtils.getJwtExpiry = originalGetJwtExpiry;
    globalThis.clearTimeout = originalClearTimeout;
  });

  it('_scheduleNextTokenRefresh does nothing when no authToken', () => {
    el.authToken = null;
    const originalSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = vi.fn();

    el._scheduleNextTokenRefresh();

    expect(globalThis.setTimeout).not.toHaveBeenCalled();
    globalThis.setTimeout = originalSetTimeout;
  });

  it('_initAuthTokenRefresh calls _scheduleNextTokenRefresh when authToken present', async () => {
    el.authToken = 'jwt-token';
    el._scheduleNextTokenRefresh = vi.fn();

    await el._initAuthTokenRefresh();

    expect(el._scheduleNextTokenRefresh).toHaveBeenCalled();
  });

  it('_initAuthTokenRefresh does nothing when no authToken', async () => {
    el.authToken = null;
    el._scheduleNextTokenRefresh = vi.fn();

    await el._initAuthTokenRefresh();

    expect(el._scheduleNextTokenRefresh).not.toHaveBeenCalled();
  });

  it('refreshUserToken updates headers and schedules refresh notification', () => {
    const now = Math.floor(Date.now() / 1000);
    const futureExp = now + 3600; // 1 hour from now
    const validJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjEyMzQ1Njc4OTB9.signature';

    el.headers = { 'X-Custom-Header': 'value' };
    el._emit = vi.fn();
    el._scheduleUserTokenRefresh = vi.fn();
    el._filterForbiddenHeaders = vi.fn((headers) => headers);

    // Mock JWT expiry extraction
    const originalGetJwtExpiry = globalThis.FormViewerUtils.getJwtExpiry;
    globalThis.FormViewerUtils.getJwtExpiry = vi
      .fn()
      .mockReturnValue(futureExp);

    el.refreshUserToken({ token: validJwt });

    expect(el.headers.Authorization).toBe(`Bearer ${validJwt}`);
    expect(el.headers['X-Custom-Header']).toBe('value');
    expect(el.userTokenExpiresAt).toBe(futureExp);
    expect(el._scheduleUserTokenRefresh).toHaveBeenCalledWith(60);
    expect(el._emit).toHaveBeenCalledWith('formio:userTokenRefreshed', {
      expiresAt: futureExp,
    });

    globalThis.FormViewerUtils.getJwtExpiry = originalGetJwtExpiry;
  });

  it('refreshUserToken updates evalContext when Form.io instance exists', () => {
    const validJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjEyMzQ1Njc4OTB9.signature';

    el.headers = {};
    el.formioInstance = {
      options: {
        evalContext: { headers: {} },
      },
    };
    el._emit = vi.fn();
    el._scheduleUserTokenRefresh = vi.fn();
    el._filterForbiddenHeaders = vi.fn((headers) => headers);

    const originalGetJwtExpiry = globalThis.FormViewerUtils.getJwtExpiry;
    globalThis.FormViewerUtils.getJwtExpiry = vi.fn().mockReturnValue(null);

    el.refreshUserToken({ token: validJwt });

    expect(el.formioInstance.options.evalContext.headers.Authorization).toBe(
      `Bearer ${validJwt}`
    );

    globalThis.FormViewerUtils.getJwtExpiry = originalGetJwtExpiry;
  });

  it('refreshUserToken uses manual expiry when provided', () => {
    const manualExpiry = 1234567890;
    const opaqueToken = 'opaque-token-123';

    el.headers = {};
    el._emit = vi.fn();
    el._scheduleUserTokenRefresh = vi.fn();
    el._filterForbiddenHeaders = vi.fn((headers) => headers);

    const originalGetJwtExpiry = globalThis.FormViewerUtils.getJwtExpiry;
    globalThis.FormViewerUtils.getJwtExpiry = vi.fn().mockReturnValue(null);

    el.refreshUserToken({ token: opaqueToken, expiresAt: manualExpiry });

    expect(el.userTokenExpiresAt).toBe(manualExpiry);
    expect(el._scheduleUserTokenRefresh).toHaveBeenCalledWith(60);
    expect(el.headers.Authorization).toBe(`Bearer ${opaqueToken}`);

    globalThis.FormViewerUtils.getJwtExpiry = originalGetJwtExpiry;
  });

  it('refreshUserToken uses custom buffer when provided', () => {
    const now = Math.floor(Date.now() / 1000);
    const futureExp = now + 3600;
    const validJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjEyMzQ1Njc4OTB9.signature';

    el.headers = {};
    el._emit = vi.fn();
    el._scheduleUserTokenRefresh = vi.fn();
    el._filterForbiddenHeaders = vi.fn((headers) => headers);

    const originalGetJwtExpiry = globalThis.FormViewerUtils.getJwtExpiry;
    globalThis.FormViewerUtils.getJwtExpiry = vi
      .fn()
      .mockReturnValue(futureExp);

    el.refreshUserToken({ token: validJwt, buffer: 120 });

    expect(el._scheduleUserTokenRefresh).toHaveBeenCalledWith(120);

    globalThis.FormViewerUtils.getJwtExpiry = originalGetJwtExpiry;
  });

  it('refreshUserToken does not schedule refresh when no expiry available', () => {
    const opaqueToken = 'opaque-token-without-expiry';

    el.headers = {};
    el._emit = vi.fn();
    el._scheduleUserTokenRefresh = vi.fn();
    el._filterForbiddenHeaders = vi.fn((headers) => headers);

    const originalGetJwtExpiry = globalThis.FormViewerUtils.getJwtExpiry;
    globalThis.FormViewerUtils.getJwtExpiry = vi.fn().mockReturnValue(null);

    el.refreshUserToken({ token: opaqueToken });

    expect(el.headers.Authorization).toBe(`Bearer ${opaqueToken}`);
    expect(el._scheduleUserTokenRefresh).not.toHaveBeenCalled();
    expect(el._emit).toHaveBeenCalledWith('formio:userTokenRefreshed', {
      expiresAt: null,
    });

    globalThis.FormViewerUtils.getJwtExpiry = originalGetJwtExpiry;
  });

  it('refreshUserToken warns and returns early for invalid token', () => {
    el.headers = {};
    el._log = { warn: vi.fn() };

    el.refreshUserToken({ token: null });
    expect(el._log.warn).toHaveBeenCalledWith(
      'refreshUserToken: invalid token'
    );

    el.refreshUserToken({ token: '' });
    expect(el._log.warn).toHaveBeenCalledWith(
      'refreshUserToken: invalid token'
    );
  });

  it('_scheduleUserTokenRefresh sets timer based on expiry time', () => {
    const now = Math.floor(Date.now() / 1000);
    const futureExp = now + 300; // 5 minutes from now
    const buffer = 60;

    el.userTokenExpiresAt = futureExp;
    el._emit = vi.fn();

    const originalSetTimeout = globalThis.setTimeout;
    let capturedDelay;
    globalThis.setTimeout = vi.fn((callback, delay) => {
      capturedDelay = delay;
      return 789; // Mock timer ID
    });

    el._scheduleUserTokenRefresh(buffer);

    const expectedDelay = (futureExp - now - buffer) * 1000;
    expect(capturedDelay).toBe(expectedDelay);
    expect(el._userTokenRefreshTimer).toBe(789);

    globalThis.setTimeout = originalSetTimeout;
  });

  it('_scheduleUserTokenRefresh uses minimum 10 second delay', () => {
    const now = Math.floor(Date.now() / 1000);
    const soonExp = now + 5; // 5 seconds from now (less than buffer)

    el.userTokenExpiresAt = soonExp;
    el._emit = vi.fn();

    const originalSetTimeout = globalThis.setTimeout;
    let capturedDelay;
    globalThis.setTimeout = vi.fn((callback, delay) => {
      capturedDelay = delay;
      return 789;
    });

    el._scheduleUserTokenRefresh(60);

    expect(capturedDelay).toBe(10000); // Minimum 10 seconds

    globalThis.setTimeout = originalSetTimeout;
  });

  it('_scheduleUserTokenRefresh clears existing timer', () => {
    el.userTokenExpiresAt = Math.floor(Date.now() / 1000) + 3600;
    el._userTokenRefreshTimer = 999;
    el._emit = vi.fn();

    const originalClearTimeout = globalThis.clearTimeout;
    globalThis.clearTimeout = vi.fn();
    const originalSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = vi.fn().mockReturnValue(888);

    el._scheduleUserTokenRefresh(60);

    expect(globalThis.clearTimeout).toHaveBeenCalledWith(999);
    expect(el._userTokenRefreshTimer).toBe(888);

    globalThis.clearTimeout = originalClearTimeout;
    globalThis.setTimeout = originalSetTimeout;
  });

  it('_scheduleUserTokenRefresh emits expiring event immediately when already expired', () => {
    const now = Math.floor(Date.now() / 1000);
    const pastExp = now - 3600; // 1 hour ago

    el.userTokenExpiresAt = pastExp;
    el._emit = vi.fn();

    el._scheduleUserTokenRefresh(60);

    expect(el._emit).toHaveBeenCalledWith('formio:userTokenExpiring', {
      expiresAt: pastExp,
      expired: true,
    });
  });

  it('_scheduleUserTokenRefresh emits expiring event when timer fires', () => {
    vi.useFakeTimers();

    const now = Math.floor(Date.now() / 1000);
    const futureExp = now + 300; // 5 minutes from now

    el.userTokenExpiresAt = futureExp;
    el._emit = vi.fn();

    el._scheduleUserTokenRefresh(60);

    // Fast-forward time to trigger the timer
    vi.advanceTimersByTime(240000); // 4 minutes

    expect(el._emit).toHaveBeenCalledWith('formio:userTokenExpiring', {
      expiresAt: futureExp,
      expired: false,
    });

    vi.useRealTimers();
  });

  it('_scheduleUserTokenRefresh does nothing when no expiry set', () => {
    el.userTokenExpiresAt = null;
    el._emit = vi.fn();

    const originalSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = vi.fn();

    el._scheduleUserTokenRefresh(60);

    expect(globalThis.setTimeout).not.toHaveBeenCalled();

    globalThis.setTimeout = originalSetTimeout;
  });

  it('destroy cleans up user token refresh timer', async () => {
    el._userTokenRefreshTimer = 123;
    el._jwtRefreshTimer = 456;
    el.formioInstance = { destroy: vi.fn() };

    const originalClearTimeout = globalThis.clearTimeout;
    globalThis.clearTimeout = vi.fn();

    await el.destroy();

    expect(globalThis.clearTimeout).toHaveBeenCalledWith(123);
    expect(globalThis.clearTimeout).toHaveBeenCalledWith(456);
    expect(el._userTokenRefreshTimer).toBeNull();
    expect(el._jwtRefreshTimer).toBeNull();

    globalThis.clearTimeout = originalClearTimeout;
  });

  it('disconnectedCallback cleans up user token refresh timer', () => {
    el._userTokenRefreshTimer = 789;
    el._jwtRefreshTimer = 101;
    el.destroy = vi.fn().mockResolvedValue(undefined);

    const originalClearTimeout = globalThis.clearTimeout;
    globalThis.clearTimeout = vi.fn();

    el.disconnectedCallback();

    expect(globalThis.clearTimeout).toHaveBeenCalledWith(789);
    expect(globalThis.clearTimeout).toHaveBeenCalledWith(101);
    expect(el._userTokenRefreshTimer).toBeNull();
    expect(el._jwtRefreshTimer).toBeNull();
    expect(el.destroy).toHaveBeenCalled();

    globalThis.clearTimeout = originalClearTimeout;
  });

  it('_registerAuthPlugin registers plugin with dynamic header resolution', () => {
    // Mock Formio global
    globalThis.globalThis.Formio = {
      registerPlugin: vi.fn(),
    };

    el.getBaseUrl = () => 'https://example.com';
    el._authPluginRegistered = false;
    el.authToken = 'bearer-token';

    // Mock validateGlobalMethods
    const originalValidate = globalThis.FormViewerUtils.validateGlobalMethods;
    globalThis.FormViewerUtils.validateGlobalMethods = vi
      .fn()
      .mockReturnValue(true);

    el._registerAuthPlugin();

    expect(globalThis.globalThis.Formio.registerPlugin).toHaveBeenCalled();
    expect(el._authPluginRegistered).toBe(true);
    expect(globalThis.__chefsViewerAuth).toBe('bearer');

    // Get the registered plugin
    const [plugin, pluginName] =
      globalThis.globalThis.Formio.registerPlugin.mock.calls[0];
    expect(pluginName).toBe('chefs-viewer-auth');
    expect(plugin.priority).toBe(0);
    expect(typeof plugin.preRequest).toBe('function');
    expect(typeof plugin.preStaticRequest).toBe('function');

    // Restore mocks
    globalThis.FormViewerUtils.validateGlobalMethods = originalValidate;
    delete globalThis.globalThis.Formio;
  });

  it('_registerAuthPlugin skips registration when already registered', () => {
    globalThis.globalThis.Formio = {
      registerPlugin: vi.fn(),
    };

    el._authPluginRegistered = true;

    // Mock validateGlobalMethods
    const originalValidate = globalThis.FormViewerUtils.validateGlobalMethods;
    globalThis.FormViewerUtils.validateGlobalMethods = vi
      .fn()
      .mockReturnValue(true);

    el._registerAuthPlugin();

    expect(globalThis.globalThis.Formio.registerPlugin).not.toHaveBeenCalled();

    // Restore mocks
    globalThis.FormViewerUtils.validateGlobalMethods = originalValidate;
    delete globalThis.globalThis.Formio;
  });

  it('_registerAuthPlugin sets Basic auth indicator when using apiKey', () => {
    globalThis.globalThis.Formio = {
      registerPlugin: vi.fn(),
    };

    el.getBaseUrl = () => 'https://example.com';
    el._authPluginRegistered = false;
    el.authToken = null;
    el.apiKey = 'api-key';

    // Mock validateGlobalMethods
    const originalValidate = globalThis.FormViewerUtils.validateGlobalMethods;
    globalThis.FormViewerUtils.validateGlobalMethods = vi
      .fn()
      .mockReturnValue(true);

    el._registerAuthPlugin();

    expect(globalThis.__chefsViewerAuth).toBe('basic');

    // Restore mocks
    globalThis.FormViewerUtils.validateGlobalMethods = originalValidate;
    delete globalThis.globalThis.Formio;
  });

  it('_registerAuthPlugin does nothing when Formio not available', () => {
    const originalValidate = globalThis.FormViewerUtils.validateGlobalMethods;
    globalThis.FormViewerUtils.validateGlobalMethods = vi
      .fn()
      .mockReturnValue(false);

    el._registerAuthPlugin();

    expect(el._authPluginRegistered).toBe(false);

    // Restore mocks
    globalThis.FormViewerUtils.validateGlobalMethods = originalValidate;
  });

  it('registered auth plugin preserves Authorization header from existing headers', () => {
    // Mock Formio global
    globalThis.globalThis.Formio = {
      registerPlugin: vi.fn(),
    };

    el.getBaseUrl = () => 'https://example.com';
    el._authPluginRegistered = false;
    el._buildAuthHeader = vi
      .fn()
      .mockReturnValue({ 'X-Chefs-Gateway-Token': 'dynamic-token' });

    // Mock validateGlobalMethods
    const originalValidate = globalThis.FormViewerUtils.validateGlobalMethods;
    globalThis.FormViewerUtils.validateGlobalMethods = vi
      .fn()
      .mockReturnValue(true);

    el._registerAuthPlugin();

    const registeredPlugin =
      globalThis.globalThis.Formio.registerPlugin.mock.calls[0][0];

    // Test that Authorization header is preserved
    const mockArgs = {
      url: 'https://example.com/api/form',
      opts: {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer host-app-token',
        },
      },
    };

    registeredPlugin.preRequest(mockArgs);

    expect(mockArgs.opts.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer host-app-token',
      'X-Chefs-Gateway-Token': 'dynamic-token',
    });

    // Restore mocks
    globalThis.FormViewerUtils.validateGlobalMethods = originalValidate;
    delete globalThis.globalThis.Formio;
  });

  it('registered auth plugin calls _buildAuthHeader dynamically', () => {
    // Mock Formio global
    globalThis.globalThis.Formio = {
      registerPlugin: vi.fn(),
    };

    el.getBaseUrl = () => 'https://example.com';
    el._authPluginRegistered = false;
    el._buildAuthHeader = vi
      .fn()
      .mockReturnValue({ 'X-Chefs-Gateway-Token': 'dynamic-token' });

    // Mock validateGlobalMethods
    const originalValidate = globalThis.FormViewerUtils.validateGlobalMethods;
    globalThis.FormViewerUtils.validateGlobalMethods = vi
      .fn()
      .mockReturnValue(true);

    el._registerAuthPlugin();

    // Get the registered plugin
    const [plugin] = globalThis.globalThis.Formio.registerPlugin.mock.calls[0];

    // Test that the plugin calls _buildAuthHeader dynamically
    const mockArgs = {
      url: 'https://example.com/api/form',
      opts: { headers: { 'Content-Type': 'application/json' } },
    };

    plugin.preRequest(mockArgs);

    expect(el._buildAuthHeader).toHaveBeenCalledWith(
      'https://example.com/api/form'
    );
    expect(mockArgs.opts.headers).toEqual({
      'Content-Type': 'application/json',
      'X-Chefs-Gateway-Token': 'dynamic-token',
    });

    // Test that plugin ignores requests to other origins
    const externalArgs = {
      url: 'https://other-site.com/api',
      opts: { headers: {} },
    };

    el._buildAuthHeader.mockClear();
    plugin.preRequest(externalArgs);

    expect(el._buildAuthHeader).not.toHaveBeenCalled();
    expect(externalArgs.opts.headers).toEqual({});

    // Restore mocks
    globalThis.FormViewerUtils.validateGlobalMethods = originalValidate;
    delete globalThis.globalThis.Formio;
  });

  it('_getAssetLoadFunction returns correct loader for .js/.css', () => {
    const cssLoader = el._getAssetLoadFunction('https://x/foo.css');
    expect(typeof cssLoader).toBe('function');
    expect(cssLoader.toString()).toMatch(/_loadCssIntoRoot/);
    const jsLoader = el._getAssetLoadFunction('https://x/foo.js');
    expect(typeof jsLoader).toBe('function');
    expect(jsLoader.toString()).toMatch(/_injectScript/);
  });

  it('_detectAssetTypeByContentType returns js/css/null based on Content-Type', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      headers: { get: () => 'application/javascript' },
    });
    expect(await el._detectAssetTypeByContentType('https://x/foo')).toBe('js');
    globalThis.fetch.mockResolvedValueOnce({
      headers: { get: () => 'text/css' },
    });
    expect(await el._detectAssetTypeByContentType('https://x/bar')).toBe('css');
    globalThis.fetch.mockResolvedValueOnce({
      headers: { get: () => 'text/html' },
    });
    expect(await el._detectAssetTypeByContentType('https://x/baz')).toBe(null);
    globalThis.fetch.mockRejectedValueOnce(new Error('fail'));
    expect(await el._detectAssetTypeByContentType('https://x/fail')).toBe(null);
  });

  it('_getAssetLoadFunction uses Content-Type detection for unknown extension and returns false for unknown type', async () => {
    // Mock _detectAssetTypeByContentType to return js
    el._detectAssetTypeByContentType = vi.fn().mockResolvedValueOnce('js');
    el._injectScript = vi.fn().mockResolvedValueOnce(true);
    expect(
      await el._getAssetLoadFunction('https://x/foo')('https://x/foo')
    ).toBe(true);
    // Mock _detectAssetTypeByContentType to return css
    el._detectAssetTypeByContentType = vi.fn().mockResolvedValueOnce('css');
    el._loadCssIntoRoot = vi.fn().mockResolvedValueOnce(true);
    expect(
      await el._getAssetLoadFunction('https://x/bar')('https://x/bar')
    ).toBe(true);
    // Mock _detectAssetTypeByContentType to return null, fallback to .js
    el._detectAssetTypeByContentType = vi.fn().mockResolvedValueOnce(null);
    el._injectScript = vi.fn().mockResolvedValueOnce(true);
    expect(
      await el._getAssetLoadFunction('https://x/foo.js')('https://x/foo.js')
    ).toBe(true);
    // Mock _detectAssetTypeByContentType to return null, fallback to .css
    el._detectAssetTypeByContentType = vi.fn().mockResolvedValueOnce(null);
    el._loadCssIntoRoot = vi.fn().mockResolvedValueOnce(true);
    expect(
      await el._getAssetLoadFunction('https://x/bar.css')('https://x/bar.css')
    ).toBe(true);
    // Unknown type: _detectAssetTypeByContentType returns null, url has neither .js nor .css
    el._detectAssetTypeByContentType = vi.fn().mockResolvedValueOnce(null);
    expect(
      await el._getAssetLoadFunction('https://x/unknown')('https://x/unknown')
    ).toBe(false);
    // ...existing code...
  });

  it('_injectScript returns false for malformed URLs and validation error', async () => {
    expect(await el._injectScript('bad')).toBe(false);
    // Mock FormViewerUtils.validateAssetUrl to throw
    const origValidate = globalThis.FormViewerUtils.validateAssetUrl;
    globalThis.FormViewerUtils.validateAssetUrl = () => {
      throw new Error('fail');
    };
    expect(await el._injectScript('https://x/foo.js')).toBe(false);
    globalThis.FormViewerUtils.validateAssetUrl = origValidate;
  });

  it('_loadCssIntoRoot returns false for malformed URLs and validation error', async () => {
    expect(await el._loadCssIntoRoot('bad')).toBe(false);
    // Mock FormViewerUtils.validateAssetUrl to throw
    const origValidate = globalThis.FormViewerUtils.validateAssetUrl;
    globalThis.FormViewerUtils.validateAssetUrl = () => {
      throw new Error('fail');
    };
    expect(await el._loadCssIntoRoot('https://x/bar.css')).toBe(false);
    globalThis.FormViewerUtils.validateAssetUrl = origValidate;
  });
  it('_loadAssetWithFallback returns true for preloaded asset, returns false if _tryLoadWithFallback or _validateLoadedAsset throws', async () => {
    // Preloaded asset
    const validateFn = vi.fn().mockReturnValue(true);
    el._isAssetPreLoaded = vi.fn().mockReturnValue(true);
    const loaded = await el._loadAssetWithFallback(
      'primary',
      null,
      true,
      'test-asset',
      validateFn
    );
    expect(loaded).toBe(true);

    // Not preloaded, _tryLoadWithFallback throws
    el._isAssetPreLoaded = vi.fn().mockReturnValue(false);
    el._getAssetLoadFunction = vi
      .fn()
      .mockReturnValue(vi.fn().mockResolvedValue(true));
    el._tryLoadWithFallback = vi.fn().mockImplementation(() => {
      throw new Error('fail');
    });
    await expect(
      el._loadAssetWithFallback('primary', null, true, 'test-asset', validateFn)
    ).rejects.toThrow('Failed to load required asset: test-asset');

    // Not preloaded, _validateLoadedAsset throws
    el._tryLoadWithFallback = vi.fn().mockResolvedValue(true);
    el._validateLoadedAsset = vi.fn().mockImplementation(() => {
      throw new Error('fail');
    });
    await expect(
      el._loadAssetWithFallback('primary', null, true, 'test-asset', validateFn)
    ).rejects.toThrow('Failed to load required asset: test-asset');
  });

  it('_parseJsonAttribute parses valid JSON and handles invalid input', () => {
    const logSpy = vi.spyOn(el._log, 'warn');
    expect(el._parseJsonAttribute('{"test":123}', 'token')).toEqual({
      test: 123,
    });
    expect(el._parseJsonAttribute('invalid', 'token')).toBeNull();
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('_parseJsonAttribute parses headers attribute correctly', () => {
    const logSpy = vi.spyOn(el._log, 'warn');
    expect(
      el._parseJsonAttribute('{"X-Custom-Header":"value"}', 'headers')
    ).toEqual({
      'X-Custom-Header': 'value',
    });
    expect(el._parseJsonAttribute('invalid-json', 'headers')).toBeNull();
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('_filterForbiddenHeaders removes browser-forbidden headers', () => {
    const headersWithForbidden = {
      'X-Custom-Header': 'value',
      Authorization: 'Bearer token',
      host: 'example.com', // Forbidden
      connection: 'keep-alive', // Forbidden
      'accept-encoding': 'gzip', // Forbidden
      cookie: 'session=abc', // Forbidden
      referer: 'https://example.com', // Forbidden
      'content-length': '123', // Forbidden
      'user-agent': 'Mozilla/5.0', // Forbidden (some browsers still block)
      'proxy-authorization': 'test', // Forbidden pattern
      'sec-fetch-mode': 'cors', // Forbidden pattern
      'Content-Type': 'application/json', // Allowed
      'X-API-Key': 'secret', // Allowed
    };

    const filtered = el._filterForbiddenHeaders(headersWithForbidden);
    expect(filtered).toEqual({
      'X-Custom-Header': 'value',
      Authorization: 'Bearer token',
      'Content-Type': 'application/json',
      'X-API-Key': 'secret',
    });
    expect(filtered.host).toBeUndefined();
    expect(filtered.connection).toBeUndefined();
    expect(filtered['accept-encoding']).toBeUndefined();
    expect(filtered.cookie).toBeUndefined();
    expect(filtered.referer).toBeUndefined();
    expect(filtered['content-length']).toBeUndefined();
    expect(filtered['user-agent']).toBeUndefined();
    expect(filtered['proxy-authorization']).toBeUndefined();
    expect(filtered['sec-fetch-mode']).toBeUndefined();
  });

  it('_filterForbiddenHeaders handles null, undefined, and non-objects', () => {
    expect(el._filterForbiddenHeaders(null)).toBe(null);
    expect(el._filterForbiddenHeaders(undefined)).toBe(undefined);
    expect(el._filterForbiddenHeaders('not-an-object')).toBe('not-an-object');
    expect(el._filterForbiddenHeaders({})).toEqual({});
  });

  it('_verifyAndParseSubmissionData handles valid and invalid payloads', () => {
    const logSpy = vi.spyOn(el._log, 'warn');
    expect(el._verifyAndParseSubmissionData({ data: { test: 1 } })).toEqual({
      data: { test: 1 },
    });
    expect(el._verifyAndParseSubmissionData([])).toEqual({ data: null });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('_verifyAndParseSchema handles valid and invalid payloads', () => {
    const logSpy = vi.spyOn(el._log, 'warn');
    const validPayload = { form: { name: 'test' }, schema: { components: [] } };
    expect(el._verifyAndParseSchema(validPayload)).toEqual({
      form: { name: 'test' },
      schema: { components: [] },
    });
    expect(el._verifyAndParseSchema([])).toEqual({ form: null, schema: null });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('_buildFormioOptions returns correct configuration', () => {
    el.readOnly = true;
    el.language = 'fr';
    el.token = { user: 'test' };
    el.user = { name: 'John' };
    el.headers = { 'X-Custom-Header': 'value' };
    el._buildHooks = vi.fn().mockReturnValue({});
    el._getSimpleFileComponentOptions = vi.fn().mockReturnValue({});
    el._getBCAddressComponentOptions = vi.fn().mockReturnValue({});

    const options = el._buildFormioOptions();
    expect(options.readOnly).toBe(true);
    expect(options.language).toBe('fr');
    expect(options.evalContext.token).toEqual({ user: 'test' });
    expect(options.evalContext.user).toEqual({ name: 'John' });
    expect(options.evalContext.headers).toEqual({ 'X-Custom-Header': 'value' });
  });

  it('_buildFormioOptions filters forbidden headers from evalContext', () => {
    el.headers = {
      'X-Custom-Header': 'value',
      host: 'example.com', // Should be filtered
      Authorization: 'Bearer token',
      'proxy-authorization': 'test', // Should be filtered
    };
    el._buildHooks = vi.fn().mockReturnValue({});
    el._getSimpleFileComponentOptions = vi.fn().mockReturnValue({});
    el._getBCAddressComponentOptions = vi.fn().mockReturnValue({});

    const options = el._buildFormioOptions();
    expect(options.evalContext.headers).toEqual({
      'X-Custom-Header': 'value',
      Authorization: 'Bearer token',
    });
    expect(options.evalContext.headers.host).toBeUndefined();
    expect(options.evalContext.headers['proxy-authorization']).toBeUndefined();
  });

  it('_ensurePrintButtonEnabled re-enables the print button in read-only', () => {
    const buttonRef = {};
    const buttonComponent = {
      component: { key: 'print', disabled: true },
      disabled: true,
      options: { disabled: { print: true } },
      refs: { button: buttonRef },
      setDisabled: vi.fn(),
      show: vi.fn(),
    };

    el.formioInstance = {
      getComponent: vi.fn().mockReturnValue(buttonComponent),
    };
    el.printButtonKey = 'print';

    el._ensurePrintButtonEnabled('test');

    expect(buttonComponent.shouldDisabled).toBe(false);
    expect(buttonComponent.component.disabled).toBe(false);
    expect(buttonComponent.disabled).toBe(false);
    expect(buttonComponent.options.disabled.print).toBe(false);
    expect(buttonComponent.setDisabled).toHaveBeenCalledWith(buttonRef, false);
    expect(buttonComponent.show).toHaveBeenCalled();
  });

  it('_getSimpleFileComponentOptions returns file operation configuration', () => {
    el._resolveUrl = vi.fn().mockReturnValue('https://test/files');
    el._emitCancelable = vi.fn().mockReturnValue(true);
    el._waitUntil = vi.fn().mockResolvedValue(true);
    el._handleFileUpload = vi.fn().mockResolvedValue({ data: 'uploaded' });
    el._buildAuthHeader = vi
      .fn()
      .mockReturnValue({ 'X-Chefs-Gateway-Token': 'test' });

    const options = el._getSimpleFileComponentOptions();
    expect(options.config.uploads.enabled).toBe(true);
    expect(typeof options.uploadFile).toBe('function');
    expect(typeof options.getFile).toBe('function');
    expect(typeof options.deleteFile).toBe('function');
  });

  it('_getBCAddressComponentOptions returns address component configuration', () => {
    el._resolveUrl = vi.fn().mockReturnValue('https://test/geo');
    el._root = el.shadowRoot;

    const options = el._getBCAddressComponentOptions();
    expect(options.providerOptions.url).toBe('https://test/geo');
    expect(options.shadowRoot).toBe(el.shadowRoot);
  });

  it('_buildHooks returns form hooks with navigation handlers', () => {
    el._manualSubmit = vi.fn();
    el._emitCancelable = vi.fn().mockReturnValue(true);
    el._waitUntil = vi.fn().mockResolvedValue(true);

    const hooks = el._buildHooks();
    expect(typeof hooks.beforeSubmit).toBe('function');
    expect(typeof hooks.beforeNext).toBe('function');
    expect(typeof hooks.beforePrev).toBe('function');
  });

  it('_emitCancelable creates cancelable event with waitUntil support', () => {
    const spy = vi.fn();
    el.addEventListener('test:event', spy);

    const result = el._emitCancelable('test:event', { data: 'test' });
    expect(result).toBe(true);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].detail.waitUntil).toBeDefined();
  });

  it('_waitUntil resolves pending waits and returns boolean result', async () => {
    el._pendingWaits = [Promise.resolve(true), Promise.resolve(false)];
    const result = await el._waitUntil();
    expect(result).toBe(false);
    expect(el._pendingWaits).toEqual([]);
  });

  it('_isAssetPreLoaded checks validation function and updates loaded assets', () => {
    const validateFn = vi.fn().mockReturnValue(true);
    expect(el._isAssetPreLoaded('test-asset', validateFn)).toBe(true);
    expect(el._loadedAssets.get('test-asset')).toBe('pre-loaded');

    expect(el._isAssetPreLoaded('other-asset')).toBe(false);
  });

  it('_validateLoadedAsset throws when validation fails', () => {
    const validateFn = vi.fn().mockReturnValue(false);
    expect(() => el._validateLoadedAsset(true, 'test', validateFn)).toThrow(
      'Asset validation failed: test'
    );
    expect(() =>
      el._validateLoadedAsset(false, 'test', validateFn)
    ).not.toThrow();
  });

  it('_handleLoadResult throws for required failed assets, logs optional failures', () => {
    expect(() =>
      el._handleLoadResult(false, 'url', null, true, 'required')
    ).toThrow('Failed to load required asset: required');

    el._assetErrors = [];
    el._handleLoadResult(false, 'url', 'fallback', false, 'optional');
    expect(el._assetErrors).toHaveLength(1);
    expect(el._assetErrors[0].type).toBe('optional');
  });

  it('_getFilenameFromDisposition extracts filename from header', () => {
    expect(
      el._getFilenameFromDisposition('attachment; filename="test.pdf"')
    ).toBe('test.pdf');
    expect(
      el._getFilenameFromDisposition('attachment; filename=document.txt')
    ).toBe('document.txt');
    expect(el._getFilenameFromDisposition('inline')).toBe('download');
  });

  it('_overrideGlobalAutocompleter saves original and blocks shadow DOM calls', () => {
    const originalAutocompleter = vi.fn();
    globalThis.autocompleter = originalAutocompleter;

    el._overrideGlobalAutocompleter();

    expect(globalThis._originalAutocompleter).toBe(originalAutocompleter);

    // Test shadow DOM blocking
    const shadowInput = document.createElement('input');
    el.shadowRoot.appendChild(shadowInput);

    const result = globalThis.autocompleter({ input: shadowInput });
    expect(result).toBeNull();
  });

  it('_loadPrefillData fetches submission data when submissionId present', async () => {
    el.submissionId = 'test-submission';
    el._resolveUrl = vi.fn().mockReturnValue('https://test/submission');
    el._buildAuthHeader = vi
      .fn()
      .mockReturnValue({ 'X-Chefs-Gateway-Token': 'test' });
    el._verifyAndParseSubmissionData = vi
      .fn()
      .mockReturnValue({ data: { name: 'test' } });

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { name: 'test' } }),
    });

    await el._loadPrefillData();
    expect(el._prefillData).toEqual({ name: 'test' });
  });

  it('_loadPrefillData handles fetch errors gracefully', async () => {
    el.submissionId = 'test-submission';
    el._resolveUrl = vi.fn().mockReturnValue('https://test/submission');
    el._buildAuthHeader = vi.fn().mockReturnValue({});

    globalThis.fetch.mockRejectedValueOnce(new Error('Network error'));

    await el._loadPrefillData();
    expect(el._prefillData).toBeNull();
  });

  it('_applyPrefill uses setSubmission when available', async () => {
    el._prefillData = { name: 'test' };
    el.formioInstance = {
      setSubmission: vi.fn().mockResolvedValue(undefined),
    };

    await el._applyPrefill();
    expect(el.formioInstance.setSubmission).toHaveBeenCalledWith(
      { data: { name: 'test' } },
      { fromSubmission: true, noValidate: true }
    );
  });

  it('_applyPrefill falls back to direct assignment', async () => {
    el._prefillData = { name: 'test' };
    el.formioInstance = {
      data: {},
      redraw: vi.fn().mockResolvedValue(undefined),
    };

    await el._applyPrefill();
    expect(el.formioInstance.submission).toEqual({ data: { name: 'test' } });
    expect(el.formioInstance.redraw).toHaveBeenCalled();
  });

  it('_manualSubmit posts submission data to backend', async () => {
    const submission = { data: { test: 'value' } };
    el._resolveUrl = vi.fn().mockReturnValue('https://test/submit');
    el._buildAuthHeader = vi
      .fn()
      .mockReturnValue({ 'X-Chefs-Gateway-Token': 'test' });
    el._emitCancelable = vi.fn().mockReturnValue(true);
    el._waitUntil = vi.fn().mockResolvedValue(true);
    el._emit = vi.fn();
    el._parseError = vi.fn();
    el.parsers = { submitResult: vi.fn().mockReturnValue({ submission }) };

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await el._manualSubmit(submission);
    expect(el._emit).toHaveBeenCalledWith('formio:submit', { submission });
    expect(el._emit).toHaveBeenCalledWith('formio:submitDone', { submission });
  });

  it('_manualSubmit handles submission errors', async () => {
    const submission = { data: { test: 'value' } };
    el._resolveUrl = vi.fn().mockReturnValue('https://test/submit');
    el._buildAuthHeader = vi.fn().mockReturnValue({});
    el._emitCancelable = vi.fn().mockReturnValue(true);
    el._waitUntil = vi.fn().mockResolvedValue(true);
    el._emit = vi.fn();
    el._parseError = vi.fn().mockResolvedValue('Submit failed');

    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    await el._manualSubmit(submission);
    expect(el._emit).toHaveBeenCalledWith('formio:error', {
      error: 'Submit failed',
    });
  });

  it('_manualSubmit triggers auto-reload for submissions but not drafts', async () => {
    const submission = { data: { test: 'value' } };
    const submitResult = { submission: { id: 'submission-123' } };

    el._resolveUrl = vi.fn().mockReturnValue('https://test/submit');
    el._buildAuthHeader = vi.fn().mockReturnValue({});
    el._emitCancelable = vi.fn().mockReturnValue(true);
    el._waitUntil = vi.fn().mockResolvedValue(true);
    el._emit = vi.fn();
    el._parseError = vi.fn();
    el.parsers = { submitResult: vi.fn().mockReturnValue(submitResult) };
    el._handleAutoReload = vi.fn().mockResolvedValue(undefined);

    // Mock fetch for successful response
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    // Test submission (should trigger auto-reload)
    el.autoReloadOnSubmit = true;
    await el._manualSubmit(submission, true);
    expect(el._handleAutoReload).toHaveBeenCalledWith(submitResult.submission);

    // Test draft (should not trigger auto-reload)
    el._handleAutoReload.mockClear();
    await el._manualSubmit(submission, false);
    expect(el._handleAutoReload).not.toHaveBeenCalled();

    // Test with auto-reload disabled
    el.autoReloadOnSubmit = false;
    el._handleAutoReload.mockClear();
    await el._manualSubmit(submission, true);
    expect(el._handleAutoReload).not.toHaveBeenCalled();
  });

  it('_handleAutoReload emits events and reloads form when not cancelled', async () => {
    const submission = { id: 'submission-123' };
    el._emitCancelable = vi.fn().mockReturnValue(true);
    el._waitUntil = vi.fn().mockResolvedValue(true);
    el._emit = vi.fn();
    el.submissionId = null;
    el.readOnly = false;
    el.reload = vi.fn().mockResolvedValue(undefined);

    // Mock setTimeout to run immediately
    const originalSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = vi.fn((callback) => {
      callback();
      return 123;
    });

    await el._handleAutoReload(submission);

    expect(el._emitCancelable).toHaveBeenCalledWith('formio:beforeAutoReload', {
      submission,
      submissionId: 'submission-123',
    });
    expect(el._emit).toHaveBeenCalledWith('formio:autoReload', {
      submission,
      submissionId: 'submission-123',
    });
    expect(el.submissionId).toBe('submission-123');
    expect(el.readOnly).toBe(true);
    expect(el.reload).toHaveBeenCalled();
    expect(el._emit).toHaveBeenCalledWith('formio:autoReloadComplete', {
      submission,
      submissionId: 'submission-123',
    });

    // Restore setTimeout
    globalThis.setTimeout = originalSetTimeout;
  });

  it('_handleAutoReload is cancelled when beforeAutoReload event is cancelled', async () => {
    const submission = { id: 'submission-123' };
    el._emitCancelable = vi.fn().mockReturnValue(false);
    el._emit = vi.fn();
    el.reload = vi.fn();

    await el._handleAutoReload(submission);

    expect(el._emitCancelable).toHaveBeenCalledWith('formio:beforeAutoReload', {
      submission,
      submissionId: 'submission-123',
    });
    // When cancelled, formio:autoReload should NOT be emitted
    expect(el._emit).not.toHaveBeenCalledWith('formio:autoReload', {
      submission,
      submissionId: 'submission-123',
    });
    expect(el.reload).not.toHaveBeenCalled();
  });

  it('_handleAutoReload is cancelled when waitUntil returns false', async () => {
    const submission = { id: 'submission-123' };
    el._emitCancelable = vi.fn().mockReturnValue(true);
    el._waitUntil = vi.fn().mockResolvedValue(false);
    el._emit = vi.fn();
    el.reload = vi.fn();

    await el._handleAutoReload(submission);

    expect(el._emitCancelable).toHaveBeenCalledWith('formio:beforeAutoReload', {
      submission,
      submissionId: 'submission-123',
    });
    // When waitUntil returns false, formio:autoReload should NOT be emitted
    expect(el._emit).not.toHaveBeenCalledWith('formio:autoReload', {
      submission,
      submissionId: 'submission-123',
    });
    expect(el.reload).not.toHaveBeenCalled();
  });

  it('_handleAutoReload handles reload errors gracefully', async () => {
    const submission = { id: 'submission-123' };
    el._emitCancelable = vi.fn().mockReturnValue(true);
    el._waitUntil = vi.fn().mockResolvedValue(true);
    el._emit = vi.fn();
    el.submissionId = null;
    el.readOnly = false;
    el.reload = vi.fn().mockRejectedValue(new Error('Reload failed'));

    // Mock setTimeout to run immediately
    const originalSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = vi.fn((callback) => {
      callback();
      return 123;
    });

    await el._handleAutoReload(submission);

    expect(el._emit).toHaveBeenCalledWith('formio:error', {
      error: 'Auto-reload failed: Reload failed',
    });

    // Restore setTimeout
    globalThis.setTimeout = originalSetTimeout;
  });

  it('_handleFileUpload processes file upload with progress tracking', async () => {
    const formData = new FormData();
    const config = { onUploadProgress: vi.fn() };
    el._resolveUrl = vi.fn().mockReturnValue('https://test/upload');
    el._buildAuthHeader = vi
      .fn()
      .mockReturnValue({ 'X-Chefs-Gateway-Token': 'test' });

    // Mock XMLHttpRequest with proper spy tracking
    const addEventListenerSpy = vi.fn();
    const mockXhr = {
      upload: { addEventListener: vi.fn() },
      addEventListener: addEventListenerSpy,
      open: vi.fn(),
      setRequestHeader: vi.fn(),
      send: vi.fn(),
      timeout: 0,
      status: 200,
      responseText: '{"success": true}',
    };

    globalThis.XMLHttpRequest = vi.fn(function () {
      Object.assign(this, mockXhr);
    });

    const uploadPromise = el._handleFileUpload(formData, config);

    // Simulate successful upload
    const loadHandler = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === 'load'
    );
    if (loadHandler && loadHandler[1]) {
      loadHandler[1]();
    }

    const result = await uploadPromise;
    expect(result.data).toEqual({ success: true });
  });

  it('_handleFileDownload fetches and stores file data', async () => {
    const fileId = 'test-file-id';
    el._resolveUrl = vi.fn().mockReturnValue('https://test/file/test-file-id');
    el._buildAuthHeader = vi.fn().mockReturnValue({});
    el._triggerFileDownload = vi.fn();

    const mockBlob = new Blob(['test content']);
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
      headers: {
        get: vi.fn().mockImplementation((header) => {
          if (header === 'content-type') return 'application/pdf';
          if (header === 'content-disposition')
            return 'attachment; filename="test.pdf"';
          return null;
        }),
      },
    });

    await el._handleFileDownload(fileId);
    expect(el.downloadFile.data).toBe(mockBlob);
    expect(el._triggerFileDownload).toHaveBeenCalled();
  });

  it('_handleFileDelete sends DELETE request for file removal', async () => {
    const fileInfo = { data: { id: 'test-file-id' } };
    el._resolveUrl = vi.fn().mockReturnValue('https://test/file/test-file-id');
    el._buildAuthHeader = vi.fn().mockReturnValue({});

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
    });

    await el._handleFileDelete(fileInfo);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://test/file/test-file-id',
      { method: 'DELETE', headers: {} }
    );
  });

  it('_triggerFileDownload creates and clicks download link', () => {
    vi.useFakeTimers();

    el.downloadFile = {
      data: new Blob(['test content'], { type: 'text/plain' }),
      headers: {
        'content-type': 'text/plain',
        'content-disposition': 'attachment; filename="test.txt"',
      },
    };

    const mockLink = {
      click: vi.fn(),
      classList: { add: vi.fn() },
      remove: vi.fn(),
    };
    const createElementSpy = vi
      .spyOn(globalThis.FormViewerUtils, 'createElement')
      .mockReturnValue(mockLink);
    // Mock URL APIs that don't exist in test environment
    globalThis.URL = globalThis.URL || {};
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:url');
    globalThis.URL.revokeObjectURL = vi.fn();

    document.body.appendChild = vi.fn();

    el._triggerFileDownload();

    expect(mockLink.click).toHaveBeenCalled();
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();

    // Fast-forward time to trigger the cleanup
    vi.advanceTimersByTime(100);
    expect(mockLink.remove).toHaveBeenCalled();

    createElementSpy.mockRestore();
    vi.useRealTimers();
  });

  it('_ensureAssets transitions through all asset states', async () => {
    el._transitionAssetState = vi.fn().mockResolvedValue(undefined);

    const result = await el._ensureAssets();

    expect(el._transitionAssetState).toHaveBeenCalledWith('HINTS');
    expect(el._transitionAssetState).toHaveBeenCalledWith('CSS');
    expect(el._transitionAssetState).toHaveBeenCalledWith('JS');
    expect(el._transitionAssetState).toHaveBeenCalledWith('FONTS');
    expect(el._transitionAssetState).toHaveBeenCalledWith('READY');
    expect(result.success).toBe(true);
  });

  it('_transitionAssetState calls appropriate load methods for each state', async () => {
    el._loadAssetHints = vi.fn().mockResolvedValue(undefined);
    el._loadCssAssets = vi.fn().mockResolvedValue(undefined);
    el._loadJsAssets = vi.fn().mockResolvedValue(undefined);
    el._loadFontsAndStyles = vi.fn().mockResolvedValue(undefined);
    el._emit = vi.fn();

    await el._transitionAssetState('HINTS');
    expect(el._loadAssetHints).toHaveBeenCalled();

    await el._transitionAssetState('CSS');
    expect(el._loadCssAssets).toHaveBeenCalled();

    await el._transitionAssetState('JS');
    expect(el._loadJsAssets).toHaveBeenCalled();

    await el._transitionAssetState('FONTS');
    expect(el._loadFontsAndStyles).toHaveBeenCalled();
  });

  it('_loadAssetHints adds resource hints for critical assets', async () => {
    el._addResourceHint = vi.fn();
    el._resolveUrl = vi.fn().mockReturnValue('https://test/asset');

    await el._loadAssetHints();

    expect(el._addResourceHint).toHaveBeenCalledWith(
      'preconnect',
      'https://cdn.jsdelivr.net',
      { crossOrigin: 'anonymous' }
    );
    expect(el._addResourceHint).toHaveBeenCalledWith(
      'preload',
      'https://test/asset',
      { as: 'style' }
    );
  });

  it('_loadCssAssets loads critical and optional CSS assets', async () => {
    el._loadAssetWithFallback = vi.fn().mockResolvedValue(true);
    el._resolveUrl = vi.fn().mockReturnValue('https://test/css');
    el._resolveUrlWithFallback = vi.fn().mockReturnValue({
      primary: 'https://test/icons',
      fallback: 'https://cdn/icons',
    });
    el.noIcons = false;
    el.themeCss = 'https://test/theme.css';

    await el._loadCssAssets();

    expect(el._loadAssetWithFallback).toHaveBeenCalledTimes(3); // main, icons, theme
  });

  it('_loadJsAssets loads FormIO and components JS', async () => {
    globalThis.FormViewerUtils.validateFormioGlobal = vi
      .fn()
      .mockReturnValue({ available: false });
    el._loadAssetWithFallback = vi.fn().mockResolvedValue(true);
    el._resolveUrl = vi.fn().mockReturnValue('https://test/js');
    el._resolveUrlWithFallback = vi.fn().mockReturnValue({
      primary: 'https://test/formio',
      fallback: 'https://cdn/formio',
    });

    await el._loadJsAssets();

    expect(el._loadAssetWithFallback).toHaveBeenCalledTimes(2); // formio, components
  });

  it('_loadFontsAndStyles handles icon setup and neutralization', async () => {
    el._injectShadowStyle = vi.fn();
    el._injectGlobalStyle = vi.fn();
    el._addResourceHint = vi.fn();
    el.getBaseUrl = vi.fn().mockReturnValue('https://test');
    el._getFontFaceCSS = vi.fn().mockReturnValue('@font-face{}');
    el._getIconColorCSS = vi.fn().mockReturnValue('.icon{}');
    el._getNeutralizeCSS = vi.fn().mockReturnValue('.neutralize{}');
    el.noIcons = false;
    el._root = el.shadowRoot;

    await el._loadFontsAndStyles();

    expect(el._injectGlobalStyle).toHaveBeenCalled();
    expect(el._addResourceHint).toHaveBeenCalled();
    expect(el._injectShadowStyle).toHaveBeenCalled();
  });

  it('_tryLoadWithFallback attempts primary then fallback URL', async () => {
    const loadFn = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const fallbackLoadFn = vi.fn().mockResolvedValue(true);
    el._getAssetLoadFunction = vi.fn().mockReturnValue(fallbackLoadFn);
    el._loadedAssets = new Map();

    const result = await el._tryLoadWithFallback(
      'primary-url',
      'fallback-url',
      'test-asset',
      loadFn
    );

    expect(loadFn).toHaveBeenCalledWith('primary-url');
    expect(fallbackLoadFn).toHaveBeenCalledWith('fallback-url');
    expect(result).toBe(true);
    expect(el._loadedAssets.get('test-asset-fallback')).toBe('fallback-url');
  });

  it('_addResourceHint creates link element with resource hints', () => {
    const mockLink = document.createElement('link');
    const createElementSpy = vi
      .spyOn(globalThis.FormViewerUtils, 'createElement')
      .mockReturnValue(mockLink);
    const appendElementSpy = vi.spyOn(
      globalThis.FormViewerUtils,
      'appendElement'
    );
    document.querySelector = vi.fn().mockReturnValue(null);

    el._addResourceHint('preload', 'https://test/asset', { as: 'style' });

    expect(createElementSpy).toHaveBeenCalledWith('link', {
      rel: 'preload',
      href: 'https://test/asset',
      as: 'style',
    });
    expect(appendElementSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendElementSpy.mockRestore();
  });

  it('_addResourceHint skips duplicate hints', () => {
    document.querySelector = vi
      .fn()
      .mockReturnValue(document.createElement('link'));
    const createElementSpy = vi.spyOn(
      globalThis.FormViewerUtils,
      'createElement'
    );

    el._addResourceHint('preload', 'https://test/asset');

    expect(createElementSpy).not.toHaveBeenCalled();
    createElementSpy.mockRestore();
  });

  it('_createFormioInstance uses createForm when available', async () => {
    const mockForm = { id: 'test-form' };
    globalThis.Formio = {
      createForm: vi.fn().mockResolvedValue(mockForm),
      Form: vi.fn(),
    };
    globalThis.FormViewerUtils.validateGlobalMethods = vi
      .fn()
      .mockReturnValue(true);

    const container = document.createElement('div');
    const schema = { components: [] };
    const options = { readOnly: true };

    const result = await el._createFormioInstance(container, schema, options);

    expect(globalThis.Formio.createForm).toHaveBeenCalledWith(
      container,
      schema,
      options
    );
    expect(result).toBe(mockForm);
    delete globalThis.Formio;
  });

  it('_createFormioInstance falls back to Form constructor', async () => {
    const mockForm = { id: 'test-form' };
    // Create a proper constructor function
    const FormConstructor = vi.fn(function() {
      Object.assign(this, mockForm);
    });
    globalThis.Formio = { Form: FormConstructor };
    globalThis.FormViewerUtils.validateGlobalMethods = vi
      .fn()
      .mockReturnValue(false);

    const container = document.createElement('div');
    const schema = { components: [] };
    const options = { readOnly: true };

    const result = await el._createFormioInstance(container, schema, options);

    expect(globalThis.Formio.Form).toHaveBeenCalledWith(
      container,
      schema,
      options
    );
    expect(result).toEqual(expect.objectContaining(mockForm));
    delete globalThis.Formio;
  });

  it('_configureInstanceEndpoints sets submission URL', () => {
    el.formioInstance = {};
    el._resolveUrl = vi.fn().mockReturnValue('https://test/submit');

    el._configureInstanceEndpoints();

    expect(el.formioInstance.url).toBe('https://test/submit');
  });

  it('_wireInstanceEvents sets up FormIO event handlers', () => {
    const mockFormio = {
      on: vi.fn(),
    };
    el.formioInstance = mockFormio;
    el._emit = vi.fn();
    el.form = { id: 'test' };

    el._wireInstanceEvents();

    expect(mockFormio.on).toHaveBeenCalledWith('render', expect.any(Function));
    expect(mockFormio.on).toHaveBeenCalledWith('change', expect.any(Function));
    expect(mockFormio.on).toHaveBeenCalledWith('submit', expect.any(Function));
    expect(mockFormio.on).toHaveBeenCalledWith(
      'submitDone',
      expect.any(Function)
    );
    expect(mockFormio.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('_setSubmissionOnInstance uses setSubmission when available', async () => {
    el.formioInstance = {
      setSubmission: vi.fn().mockResolvedValue(undefined),
    };
    const data = { name: 'test' };
    const opts = { noValidate: true };

    await el._setSubmissionOnInstance(data, opts);

    expect(el.formioInstance.setSubmission).toHaveBeenCalledWith(
      { data },
      opts
    );
  });

  it('_setSubmissionOnInstance falls back to direct assignment with redraw', async () => {
    el.formioInstance = {
      redraw: vi.fn().mockResolvedValue(undefined),
    };
    const data = { name: 'test' };

    await el._setSubmissionOnInstance(data);

    expect(el.formioInstance.submission).toEqual({ data });
    expect(el.formioInstance.redraw).toHaveBeenCalled();
  });

  it('_loadSchema fetches and parses form schema', async () => {
    el._resolveUrl = vi.fn().mockReturnValue('https://test/schema');
    el._buildAuthHeader = vi.fn().mockReturnValue({});
    el._emit = vi.fn().mockReturnValue(true);
    el._parseError = vi.fn();
    el.parsers = {
      schema: vi.fn().mockReturnValue({
        form: { name: 'Test Form' },
        schema: { components: [] },
      }),
    };

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          form: { name: 'Test Form' },
          schema: { components: [] },
        }),
    });

    await el._loadSchema();

    expect(el.form).toEqual({ name: 'Test Form' });
    expect(el.formSchema).toEqual({ components: [] });
    expect(el.formName).toBe('Test Form');
  });

  it('_loadSchema handles fetch errors', async () => {
    el._resolveUrl = vi.fn().mockReturnValue('https://test/schema');
    el._buildAuthHeader = vi.fn().mockReturnValue({});
    el._emit = vi.fn().mockReturnValue(true);
    el._parseError = vi.fn().mockResolvedValue('Schema load failed');

    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(el._loadSchema()).rejects.toThrow('Schema load failed');
    expect(el._emit).toHaveBeenCalledWith('formio:error', {
      error: 'Schema load failed',
    });
  });

  it('_performDownload creates and triggers download link', () => {
    vi.useFakeTimers();

    const data = new Blob(['test content']);
    el.downloadFile = {
      headers: { 'content-disposition': 'attachment; filename="test.txt"' },
    };

    const mockLink = {
      click: vi.fn(),
      classList: { add: vi.fn() },
      remove: vi.fn(),
    };
    const createElementSpy = vi
      .spyOn(globalThis.FormViewerUtils, 'createElement')
      .mockReturnValue(mockLink);
    // Mock URL APIs that don't exist in test environment
    globalThis.URL = globalThis.URL || {};
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:url');
    globalThis.URL.revokeObjectURL = vi.fn();

    document.body.appendChild = vi.fn();

    el._performDownload(data);

    expect(mockLink.click).toHaveBeenCalled();
    expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(data);

    // Fast-forward time to trigger the cleanup
    vi.advanceTimersByTime(100);
    expect(mockLink.remove).toHaveBeenCalled();

    createElementSpy.mockRestore();
    vi.useRealTimers();
  });

  // hostData tests
  it('host-data attribute parses valid JSON', () => {
    el.setAttribute('host-data', '{"lookup":[1,2,3],"config":{"max":10}}');
    expect(el.hostData).toEqual({ lookup: [1, 2, 3], config: { max: 10 } });
  });

  it('host-data attribute handles invalid JSON gracefully', () => {
    const logSpy = vi.spyOn(el._log, 'warn');
    el.setAttribute('host-data', 'not valid json');
    expect(el.hostData).toBeNull();
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('host-data attribute handles empty string', () => {
    el.setAttribute('host-data', '');
    expect(el.hostData).toBeNull();
  });

  it('hostData property can be set directly', () => {
    el.hostData = { directData: 'value' };
    expect(el.hostData).toEqual({ directData: 'value' });
  });

  it('setHostData merges data by default', () => {
    el.hostData = { existing: 'value1' };
    el.setHostData({ newData: 'value2' });
    expect(el.hostData).toEqual({ existing: 'value1', newData: 'value2' });
  });

  it('setHostData replaces data when replace option is true', () => {
    el.hostData = { existing: 'value1', old: 'data' };
    el.setHostData({ fresh: 'value2' }, { replace: true });
    expect(el.hostData).toEqual({ fresh: 'value2' });
    expect(el.hostData.existing).toBeUndefined();
    expect(el.hostData.old).toBeUndefined();
  });

  it('setHostData rejects non-object data', () => {
    const logSpy = vi.spyOn(el._log, 'warn');
    el.hostData = { existing: 'value' };

    el.setHostData(null);
    expect(el.hostData).toEqual({ existing: 'value' });

    el.setHostData('string');
    expect(el.hostData).toEqual({ existing: 'value' });

    el.setHostData([1, 2, 3]);
    expect(el.hostData).toEqual({ existing: 'value' });

    expect(logSpy).toHaveBeenCalledTimes(3);
    logSpy.mockRestore();
  });

  it('setHostData updates live evalContext when formioInstance exists', () => {
    el.formioInstance = {
      options: {
        evalContext: {},
      },
    };
    el.setHostData({ liveData: 'test' });
    expect(el.formioInstance.options.evalContext.host).toEqual({
      liveData: 'test',
    });
  });

  it('setHostData emits formio:hostDataChanged event', () => {
    const eventSpy = vi.fn();
    el.addEventListener('formio:hostDataChanged', eventSpy);

    el.setHostData({ eventData: 'value' });

    expect(eventSpy).toHaveBeenCalled();
    const eventDetail = eventSpy.mock.calls[0][0].detail;
    expect(eventDetail.hostData).toEqual({ eventData: 'value' });
  });

  it('getHostData returns null when hostData is not set', () => {
    el.hostData = null;
    expect(el.getHostData()).toBeNull();
  });

  it('getHostData returns a copy of hostData', () => {
    el.hostData = { original: 'value' };
    const copy = el.getHostData();
    expect(copy).toEqual({ original: 'value' });

    // Mutating the copy should not affect the original
    copy.mutated = 'new';
    expect(el.hostData.mutated).toBeUndefined();
  });

  it('_buildFormioOptions includes hostData in evalContext as host', () => {
    el.hostData = { config: { feature: true }, lookup: ['a', 'b'] };
    el._buildHooks = vi.fn().mockReturnValue({});
    el._getSimpleFileComponentOptions = vi.fn().mockReturnValue({});
    el._getBCAddressComponentOptions = vi.fn().mockReturnValue({});

    const options = el._buildFormioOptions();
    expect(options.evalContext.host).toEqual({
      config: { feature: true },
      lookup: ['a', 'b'],
    });
  });

  it('_buildFormioOptions excludes host from evalContext when hostData is null', () => {
    el.hostData = null;
    el._buildHooks = vi.fn().mockReturnValue({});
    el._getSimpleFileComponentOptions = vi.fn().mockReturnValue({});
    el._getBCAddressComponentOptions = vi.fn().mockReturnValue({});

    const options = el._buildFormioOptions();
    expect(options.evalContext.host).toBeUndefined();
  });

  it('_parseJsonAttribute parses host-data attribute correctly', () => {
    const logSpy = vi.spyOn(el._log, 'warn');
    expect(
      el._parseJsonAttribute('{"employees":[{"id":1}]}', 'host-data')
    ).toEqual({
      employees: [{ id: 1 }],
    });
    expect(el._parseJsonAttribute('invalid-json', 'host-data')).toBeNull();
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  // submit-mode attribute tests
  it('submit-mode attribute defaults to chefs', () => {
    expect(el.submitMode).toBe('chefs');
  });

  it('submit-mode attribute parses valid values', () => {
    el.setAttribute('submit-mode', 'host');
    expect(el.submitMode).toBe('host');

    el.setAttribute('submit-mode', 'none');
    expect(el.submitMode).toBe('none');

    el.setAttribute('submit-mode', 'chefs');
    expect(el.submitMode).toBe('chefs');
  });

  it('submit-mode attribute handles empty string as chefs', () => {
    el.setAttribute('submit-mode', '');
    expect(el.submitMode).toBe('chefs');
  });

  it('submitMode property can be set directly', () => {
    el.submitMode = 'host';
    expect(el.submitMode).toBe('host');

    el.submitMode = 'none';
    expect(el.submitMode).toBe('none');
  });

  // _handleHostSubmit tests
  it('_handleHostSubmit emits formio:hostSubmit with correct detail', async () => {
    const eventSpy = vi.fn();
    el.addEventListener('formio:hostSubmit', eventSpy);

    el.formId = 'test-form-id';
    el.formName = 'Test Form';
    el.submitMode = 'host';
    el._displayAsReadOnly = vi.fn().mockResolvedValue(undefined);
    el._pendingWaits = [];

    const submission = { data: { field: 'value' } };
    await el._handleHostSubmit(submission, true);

    expect(eventSpy).toHaveBeenCalled();
    const detail = eventSpy.mock.calls[0][0].detail;
    expect(detail.data).toEqual({ field: 'value' });
    expect(detail.submission).toBe(submission);
    expect(detail.formId).toBe('test-form-id');
    expect(detail.formName).toBe('Test Form');
    expect(detail.isDraft).toBe(false);
    expect(detail.timestamp).toBeDefined();
    expect(typeof detail.waitUntil).toBe('function');
  });

  it('_handleHostSubmit sets isDraft true for draft saves', async () => {
    const eventSpy = vi.fn();
    el.addEventListener('formio:hostSubmit', eventSpy);

    el.submitMode = 'host';
    el._displayAsReadOnly = vi.fn().mockResolvedValue(undefined);
    el._pendingWaits = [];

    await el._handleHostSubmit({ data: {} }, false);

    const detail = eventSpy.mock.calls[0][0].detail;
    expect(detail.isDraft).toBe(true);
  });

  it('_handleHostSubmit auto-displays read-only for host mode submissions', async () => {
    el.submitMode = 'host';
    el._displayAsReadOnly = vi.fn().mockResolvedValue(undefined);
    el._pendingWaits = [];

    const submission = { data: { name: 'test' } };
    await el._handleHostSubmit(submission, true);

    expect(el._displayAsReadOnly).toHaveBeenCalledWith({ name: 'test' });
  });

  it('_handleHostSubmit does not auto-display for host mode drafts', async () => {
    el.submitMode = 'host';
    el._displayAsReadOnly = vi.fn().mockResolvedValue(undefined);
    el._pendingWaits = [];

    await el._handleHostSubmit({ data: { name: 'test' } }, false);

    expect(el._displayAsReadOnly).not.toHaveBeenCalled();
  });

  it('_handleHostSubmit does not auto-display for none mode', async () => {
    el.submitMode = 'none';
    el._displayAsReadOnly = vi.fn().mockResolvedValue(undefined);
    el._pendingWaits = [];

    await el._handleHostSubmit({ data: { name: 'test' } }, true);

    expect(el._displayAsReadOnly).not.toHaveBeenCalled();
  });

  it('_handleHostSubmit respects preventDefault from event', async () => {
    el.addEventListener('formio:hostSubmit', (e) => e.preventDefault());

    el.submitMode = 'host';
    el._displayAsReadOnly = vi.fn().mockResolvedValue(undefined);
    el._pendingWaits = [];

    await el._handleHostSubmit({ data: { name: 'test' } }, true);

    expect(el._displayAsReadOnly).not.toHaveBeenCalled();
  });

  it('_handleHostSubmit respects waitUntil returning false', async () => {
    el.addEventListener('formio:hostSubmit', (e) => {
      e.detail.waitUntil(Promise.resolve(false));
    });

    el.submitMode = 'host';
    el._displayAsReadOnly = vi.fn().mockResolvedValue(undefined);

    await el._handleHostSubmit({ data: { name: 'test' } }, true);

    expect(el._displayAsReadOnly).not.toHaveBeenCalled();
  });

  // _displayAsReadOnly tests
  it('_displayAsReadOnly sets readOnly and reloads with data', async () => {
    el.readOnly = false;
    el.reload = vi.fn().mockResolvedValue(undefined);
    el.setSubmission = vi.fn();

    await el._displayAsReadOnly({ field: 'value' });

    expect(el.readOnly).toBe(true);
    expect(el.reload).toHaveBeenCalled();
    expect(el.setSubmission).toHaveBeenCalledWith({ field: 'value' });
  });

  // _manualSubmit with submitMode tests
  it('_manualSubmit calls _handleHostSubmit for host mode', async () => {
    el.submitMode = 'host';
    el._handleHostSubmit = vi.fn().mockResolvedValue(undefined);
    el._emitCancelable = vi.fn().mockReturnValue(true);
    el._pendingWaits = [];

    await el._manualSubmit({ data: { test: 'value' } }, true);

    expect(el._handleHostSubmit).toHaveBeenCalledWith(
      { data: { test: 'value' } },
      true
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('_manualSubmit calls _handleHostSubmit for none mode', async () => {
    el.submitMode = 'none';
    el._handleHostSubmit = vi.fn().mockResolvedValue(undefined);
    el._emitCancelable = vi.fn().mockReturnValue(true);
    el._pendingWaits = [];

    await el._manualSubmit({ data: { test: 'value' } }, false);

    expect(el._handleHostSubmit).toHaveBeenCalledWith(
      { data: { test: 'value' } },
      false
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('_manualSubmit posts to backend for default chefs mode', async () => {
    el.submitMode = 'chefs';
    el._resolveUrl = vi.fn().mockReturnValue('https://test/submit');
    el._buildAuthHeader = vi.fn().mockReturnValue({});
    el._emitCancelable = vi.fn().mockReturnValue(true);
    el._pendingWaits = [];
    el._emit = vi.fn();
    el._parseError = vi.fn();
    el.parsers = {
      submitResult: vi.fn().mockReturnValue({ submission: { id: 'sub-123' } }),
    };
    el._handleAutoReload = vi.fn().mockResolvedValue(undefined);

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'sub-123' }),
    });

    await el._manualSubmit({ data: { test: 'value' } }, true);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://test/submit',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ submission: { data: { test: 'value' } } }),
      })
    );
  });

  // reload() method tests
  it('reload calls destroy then load', async () => {
    el.destroy = vi.fn().mockResolvedValue(undefined);
    el.load = vi.fn().mockResolvedValue(undefined);

    await el.reload();

    expect(el.destroy).toHaveBeenCalled();
    expect(el.load).toHaveBeenCalled();
  });

  it('reload is called in correct order', async () => {
    const callOrder = [];
    el.destroy = vi.fn().mockImplementation(async () => {
      callOrder.push('destroy');
    });
    el.load = vi.fn().mockImplementation(async () => {
      callOrder.push('load');
    });

    await el.reload();

    expect(callOrder).toEqual(['destroy', 'load']);
  });

  // print() method tests
  it('print acquires and releases busy lock', async () => {
    const acquireSpy = vi.spyOn(el, '_acquireBusyLock').mockReturnValue(true);
    const releaseSpy = vi.spyOn(el, '_releaseBusyLock');
    el._emitCancelable = vi.fn().mockReturnValue(true);
    el._pendingWaits = [];
    el._resolveUrl = vi.fn().mockReturnValue('https://test/print');
    el._buildAuthHeader = vi.fn().mockReturnValue({});

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(new Blob(['pdf'])),
      headers: {
        get: vi.fn().mockReturnValue('application/pdf'),
      },
    });

    el._triggerFileDownload = vi.fn();
    el._emit = vi.fn();

    await el.print();

    expect(acquireSpy).toHaveBeenCalledWith('print');
    expect(releaseSpy).toHaveBeenCalled();
    acquireSpy.mockRestore();
    releaseSpy.mockRestore();
  });

  it('print emits formio:beforePrint event', async () => {
    const eventSpy = vi.fn();
    el.addEventListener('formio:beforePrint', eventSpy);

    el._acquireBusyLock = vi.fn().mockReturnValue(true);
    el._releaseBusyLock = vi.fn();
    el._resolveUrl = vi.fn().mockReturnValue('https://test/print');
    el._buildAuthHeader = vi.fn().mockReturnValue({});
    el._pendingWaits = [];

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(new Blob(['pdf'])),
      headers: { get: vi.fn().mockReturnValue('application/pdf') },
    });

    el._triggerFileDownload = vi.fn();

    await el.print();

    expect(eventSpy).toHaveBeenCalled();
    expect(eventSpy.mock.calls[0][0].detail.formId).toBe(el.formId);
  });

  it('print handles print errors gracefully', async () => {
    el._acquireBusyLock = vi.fn().mockReturnValue(true);
    el._releaseBusyLock = vi.fn();
    el._emitCancelable = vi.fn().mockReturnValue(true);
    el._pendingWaits = [];
    el._resolveUrl = vi.fn().mockReturnValue('https://test/print');
    el._buildAuthHeader = vi.fn().mockReturnValue({});
    el._parseError = vi.fn().mockResolvedValue('Print service error');
    el._emit = vi.fn();

    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await el.print();

    expect(el._emit).toHaveBeenCalledWith('formio:error', {
      error: 'Print service error',
    });
  });

  it('print respects cancelled event', async () => {
    el._acquireBusyLock = vi.fn().mockReturnValue(true);
    el._releaseBusyLock = vi.fn();
    el._emitCancelable = vi.fn().mockReturnValue(false);
    el._resolveUrl = vi.fn().mockReturnValue('https://test/print');

    await el.print();

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  // Additional edge cases for _handleHostSubmit
  it('_handleHostSubmit handles empty submission data', async () => {
    const eventSpy = vi.fn();
    el.addEventListener('formio:hostSubmit', eventSpy);

    el.submitMode = 'host';
    el._displayAsReadOnly = vi.fn().mockResolvedValue(undefined);
    el._pendingWaits = [];

    await el._handleHostSubmit({ data: null }, true);

    const detail = eventSpy.mock.calls[0][0].detail;
    expect(detail.data).toEqual({});
    expect(el._displayAsReadOnly).toHaveBeenCalledWith({});
  });

  it('_handleHostSubmit handles undefined submission', async () => {
    const eventSpy = vi.fn();
    el.addEventListener('formio:hostSubmit', eventSpy);

    el.submitMode = 'host';
    el._displayAsReadOnly = vi.fn().mockResolvedValue(undefined);
    el._pendingWaits = [];

    await el._handleHostSubmit(undefined, true);

    const detail = eventSpy.mock.calls[0][0].detail;
    expect(detail.data).toEqual({});
  });

  // Additional edge cases for _displayAsReadOnly
  it('_displayAsReadOnly awaits reload before setSubmission', async () => {
    const callOrder = [];
    el.reload = vi.fn().mockImplementation(async () => {
      callOrder.push('reload');
    });
    el.setSubmission = vi.fn().mockImplementation(() => {
      callOrder.push('setSubmission');
    });

    await el._displayAsReadOnly({ test: 'data' });

    expect(callOrder).toEqual(['reload', 'setSubmission']);
  });

  // Edge cases for submitMode with _manualSubmit
  it('_manualSubmit skips backend when submitMode is host and event is cancelled', async () => {
    el.submitMode = 'host';
    el._handleHostSubmit = vi.fn().mockResolvedValue(undefined);
    el._emitCancelable = vi.fn().mockReturnValue(false);
    el._pendingWaits = [];

    await el._manualSubmit({ data: {} }, true);

    expect(el._handleHostSubmit).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('_manualSubmit skips backend when submitMode is none and waitUntil returns false', async () => {
    el.submitMode = 'none';
    el._handleHostSubmit = vi.fn().mockResolvedValue(undefined);
    el._emitCancelable = vi.fn().mockReturnValue(true);
    el._pendingWaits = [Promise.resolve(false)];

    await el._manualSubmit({ data: {} }, true);

    expect(el._handleHostSubmit).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
