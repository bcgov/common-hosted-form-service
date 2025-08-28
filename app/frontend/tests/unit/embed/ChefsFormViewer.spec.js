/* eslint-disable no-undef */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the component script to register the custom element and expose FormViewerUtils
const COMPONENT_PATH = '../../../public/embed/chefs-form-viewer.js';

// --- Pure Utility Tests ---
describe('FormViewerUtils', () => {
  let utils;
  beforeAll(async () => {
    await import(COMPONENT_PATH);
    utils = window.FormViewerUtils;
  });

  it('validateAssetUrl throws for invalid URLs and passes for valid ones', () => {
    const { validateAssetUrl } = window.FormViewerUtils;
    // Valid JS and CSS URLs
    expect(() => validateAssetUrl('https://x/foo.js', 'js')).not.toThrow();
    expect(() => validateAssetUrl('http://x/bar.css', 'css')).not.toThrow();
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
    expect(() => validateAssetUrl('http://x/bar', 'css')).not.toThrow();
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
    document.body.removeChild(el);
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
  let el;
  beforeEach(async () => {
    await import(COMPONENT_PATH);
    el = document.createElement('chefs-form-viewer');
    document.body.appendChild(el);
    // Always mock fetch for asset loader tests
    globalThis._origFetch = globalThis.fetch;
    globalThis.fetch = vi.fn();
  });
  afterEach(() => {
    document.body.removeChild(el);
    // Restore fetch after each test
    globalThis.fetch = globalThis._origFetch;
    delete globalThis._origFetch;
  });

  it('_buildAuthHeader uses custom hook when provided', () => {
    el.onBuildAuthHeader = (_url) => ({ Authorization: 'Custom' });
    expect(el._buildAuthHeader('https://x')).toEqual({
      Authorization: 'Custom',
    });
  });

  it('_buildAuthHeader prefers Bearer over Basic auth', () => {
    el.authToken = 'jwt-token-123';
    el.formId = 'form-456';
    el.apiKey = 'api-key-789';
    el.getBaseUrl = () => 'https://example.com';

    const result = el._buildAuthHeader('https://example.com/api');
    expect(result).toEqual({ Authorization: 'Bearer jwt-token-123' });
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

  it('_buildAuthHeader logs error when Basic auth creation fails', () => {
    el.authToken = null;
    el.formId = 'abc';
    el.apiKey = 'def';
    el.getBaseUrl = () => 'https://example.com';

    // Patch createBasicAuthHeader to throw
    const orig = window.FormViewerUtils.createBasicAuthHeader;
    window.FormViewerUtils.createBasicAuthHeader = () => {
      throw new Error('fail');
    };
    const spy = vi.spyOn(el._log, 'warn');

    expect(el._buildAuthHeader('https://example.com/api')).toEqual({});
    expect(spy).toHaveBeenCalledWith(
      'Failed to create Basic Auth header',
      expect.any(Object)
    );

    window.FormViewerUtils.createBasicAuthHeader = orig;
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
    const originalGetJwtExpiry = window.FormViewerUtils.getJwtExpiry;
    window.FormViewerUtils.getJwtExpiry = vi.fn().mockReturnValue(futureExp);

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
    window.FormViewerUtils.getJwtExpiry = originalGetJwtExpiry;
    globalThis.setTimeout = originalSetTimeout;
  });

  it('_scheduleNextTokenRefresh uses minimum 10 second delay', () => {
    const now = Math.floor(Date.now() / 1000);
    const soonExp = now + 5; // 5 seconds from now (less than 60 second buffer)

    el.authToken = 'jwt-token';

    // Mock JWT expiry extraction
    const originalGetJwtExpiry = window.FormViewerUtils.getJwtExpiry;
    window.FormViewerUtils.getJwtExpiry = vi.fn().mockReturnValue(soonExp);

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
    window.FormViewerUtils.getJwtExpiry = originalGetJwtExpiry;
    globalThis.setTimeout = originalSetTimeout;
  });

  it('_scheduleNextTokenRefresh clears existing timer', () => {
    el.authToken = 'jwt-token';
    el._jwtRefreshTimer = 456; // Existing timer

    // Mock clearTimeout
    const originalClearTimeout = globalThis.clearTimeout;
    globalThis.clearTimeout = vi.fn();

    // Mock getJwtExpiry to return null (invalid token)
    const originalGetJwtExpiry = window.FormViewerUtils.getJwtExpiry;
    window.FormViewerUtils.getJwtExpiry = vi.fn().mockReturnValue(null);

    el._scheduleNextTokenRefresh();

    expect(globalThis.clearTimeout).toHaveBeenCalledWith(456);
    expect(el._jwtRefreshTimer).toBe(null);

    // Restore mocks
    window.FormViewerUtils.getJwtExpiry = originalGetJwtExpiry;
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

  it('_registerAuthPlugin registers plugin with dynamic header resolution', () => {
    // Mock Formio global
    globalThis.window.Formio = {
      registerPlugin: vi.fn(),
    };

    el.getBaseUrl = () => 'https://example.com';
    el._authPluginRegistered = false;
    el.authToken = 'bearer-token';

    // Mock validateGlobalMethods
    const originalValidate = window.FormViewerUtils.validateGlobalMethods;
    window.FormViewerUtils.validateGlobalMethods = vi
      .fn()
      .mockReturnValue(true);

    el._registerAuthPlugin();

    expect(globalThis.window.Formio.registerPlugin).toHaveBeenCalled();
    expect(el._authPluginRegistered).toBe(true);
    expect(globalThis.window.__chefsViewerAuth).toBe('bearer');

    // Get the registered plugin
    const [plugin, pluginName] =
      globalThis.window.Formio.registerPlugin.mock.calls[0];
    expect(pluginName).toBe('chefs-viewer-auth');
    expect(plugin.priority).toBe(0);
    expect(typeof plugin.preRequest).toBe('function');
    expect(typeof plugin.preStaticRequest).toBe('function');

    // Restore mocks
    window.FormViewerUtils.validateGlobalMethods = originalValidate;
    delete globalThis.window.Formio;
  });

  it('_registerAuthPlugin skips registration when already registered', () => {
    globalThis.window.Formio = {
      registerPlugin: vi.fn(),
    };

    el._authPluginRegistered = true;

    // Mock validateGlobalMethods
    const originalValidate = window.FormViewerUtils.validateGlobalMethods;
    window.FormViewerUtils.validateGlobalMethods = vi
      .fn()
      .mockReturnValue(true);

    el._registerAuthPlugin();

    expect(globalThis.window.Formio.registerPlugin).not.toHaveBeenCalled();

    // Restore mocks
    window.FormViewerUtils.validateGlobalMethods = originalValidate;
    delete globalThis.window.Formio;
  });

  it('_registerAuthPlugin sets Basic auth indicator when using apiKey', () => {
    globalThis.window.Formio = {
      registerPlugin: vi.fn(),
    };

    el.getBaseUrl = () => 'https://example.com';
    el._authPluginRegistered = false;
    el.authToken = null;
    el.apiKey = 'api-key';

    // Mock validateGlobalMethods
    const originalValidate = window.FormViewerUtils.validateGlobalMethods;
    window.FormViewerUtils.validateGlobalMethods = vi
      .fn()
      .mockReturnValue(true);

    el._registerAuthPlugin();

    expect(globalThis.window.__chefsViewerAuth).toBe('basic');

    // Restore mocks
    window.FormViewerUtils.validateGlobalMethods = originalValidate;
    delete globalThis.window.Formio;
  });

  it('_registerAuthPlugin does nothing when Formio not available', () => {
    const originalValidate = window.FormViewerUtils.validateGlobalMethods;
    window.FormViewerUtils.validateGlobalMethods = vi
      .fn()
      .mockReturnValue(false);

    el._registerAuthPlugin();

    expect(el._authPluginRegistered).toBe(false);

    // Restore mocks
    window.FormViewerUtils.validateGlobalMethods = originalValidate;
  });

  it('registered auth plugin calls _buildAuthHeader dynamically', () => {
    // Mock Formio global
    globalThis.window.Formio = {
      registerPlugin: vi.fn(),
    };

    el.getBaseUrl = () => 'https://example.com';
    el._authPluginRegistered = false;
    el._buildAuthHeader = vi
      .fn()
      .mockReturnValue({ Authorization: 'Bearer dynamic-token' });

    // Mock validateGlobalMethods
    const originalValidate = window.FormViewerUtils.validateGlobalMethods;
    window.FormViewerUtils.validateGlobalMethods = vi
      .fn()
      .mockReturnValue(true);

    el._registerAuthPlugin();

    // Get the registered plugin
    const [plugin] = globalThis.window.Formio.registerPlugin.mock.calls[0];

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
      Authorization: 'Bearer dynamic-token',
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
    window.FormViewerUtils.validateGlobalMethods = originalValidate;
    delete globalThis.window.Formio;
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
    window.fetch.mockResolvedValueOnce({
      headers: { get: () => 'application/javascript' },
    });
    expect(await el._detectAssetTypeByContentType('https://x/foo')).toBe('js');
    window.fetch.mockResolvedValueOnce({
      headers: { get: () => 'text/css' },
    });
    expect(await el._detectAssetTypeByContentType('https://x/bar')).toBe('css');
    window.fetch.mockResolvedValueOnce({
      headers: { get: () => 'text/html' },
    });
    expect(await el._detectAssetTypeByContentType('https://x/baz')).toBe(null);
    window.fetch.mockRejectedValueOnce(new Error('fail'));
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
    const origValidate = window.FormViewerUtils.validateAssetUrl;
    window.FormViewerUtils.validateAssetUrl = () => {
      throw new Error('fail');
    };
    expect(await el._injectScript('https://x/foo.js')).toBe(false);
    window.FormViewerUtils.validateAssetUrl = origValidate;
  });

  it('_loadCssIntoRoot returns false for malformed URLs and validation error', async () => {
    expect(await el._loadCssIntoRoot('bad')).toBe(false);
    // Mock FormViewerUtils.validateAssetUrl to throw
    const origValidate = window.FormViewerUtils.validateAssetUrl;
    window.FormViewerUtils.validateAssetUrl = () => {
      throw new Error('fail');
    };
    expect(await el._loadCssIntoRoot('https://x/bar.css')).toBe(false);
    window.FormViewerUtils.validateAssetUrl = origValidate;
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
});
