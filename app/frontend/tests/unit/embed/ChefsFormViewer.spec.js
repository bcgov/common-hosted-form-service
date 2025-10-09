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
    el.remove();
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
    el.remove();
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

  it('registered auth plugin calls _buildAuthHeader dynamically', () => {
    // Mock Formio global
    globalThis.globalThis.Formio = {
      registerPlugin: vi.fn(),
    };

    el.getBaseUrl = () => 'https://example.com';
    el._authPluginRegistered = false;
    el._buildAuthHeader = vi
      .fn()
      .mockReturnValue({ Authorization: 'Bearer dynamic-token' });

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
    el._buildHooks = vi.fn().mockReturnValue({});
    el._getSimpleFileComponentOptions = vi.fn().mockReturnValue({});
    el._getBCAddressComponentOptions = vi.fn().mockReturnValue({});

    const options = el._buildFormioOptions();
    expect(options.readOnly).toBe(true);
    expect(options.language).toBe('fr');
    expect(options.evalContext.token).toEqual({ user: 'test' });
    expect(options.evalContext.user).toEqual({ name: 'John' });
  });

  it('_getSimpleFileComponentOptions returns file operation configuration', () => {
    el._resolveUrl = vi.fn().mockReturnValue('https://test/files');
    el._emitCancelable = vi.fn().mockReturnValue(true);
    el._waitUntil = vi.fn().mockResolvedValue(true);
    el._handleFileUpload = vi.fn().mockResolvedValue({ data: 'uploaded' });
    el._buildAuthHeader = vi
      .fn()
      .mockReturnValue({ Authorization: 'Bearer test' });

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
      .mockReturnValue({ Authorization: 'Bearer test' });
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
      .mockReturnValue({ Authorization: 'Bearer test' });
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

  it('_handleFileUpload processes file upload with progress tracking', async () => {
    const formData = new FormData();
    const config = { onUploadProgress: vi.fn() };
    el._resolveUrl = vi.fn().mockReturnValue('https://test/upload');
    el._buildAuthHeader = vi
      .fn()
      .mockReturnValue({ Authorization: 'Bearer test' });

    // Mock XMLHttpRequest
    const mockXhr = {
      upload: { addEventListener: vi.fn() },
      addEventListener: vi.fn(),
      open: vi.fn(),
      setRequestHeader: vi.fn(),
      send: vi.fn(),
      timeout: 0,
      status: 200,
      responseText: '{"success": true}',
    };

    globalThis.XMLHttpRequest = vi.fn(() => mockXhr);

    const uploadPromise = el._handleFileUpload(formData, config);

    // Simulate successful upload
    const loadHandler = mockXhr.addEventListener.mock.calls.find(
      (call) => call[0] === 'load'
    )[1];
    loadHandler();

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
    globalThis.Formio = { Form: vi.fn().mockReturnValue(mockForm) };
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
    expect(result).toBe(mockForm);
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
});
