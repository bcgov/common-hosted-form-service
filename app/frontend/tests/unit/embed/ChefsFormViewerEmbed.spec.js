/* eslint-disable no-console */
import { beforeAll, describe, expect, it, vi } from 'vitest';

// Import the actual utility functions from the embed script
let embedUtils;
beforeAll(async () => {
  embedUtils = await import('../../../public/embed/chefs-form-viewer-embed.js');
});

/**
 * Unit tests for chefs-form-viewer-embed.js
 *
 * Tests core functionality of the embed script by testing the actual
 * utility functions instead of mocking them.
 */

describe('chefs-form-viewer-embed.js', () => {
  it('should parse URL parameters using actual parseQueryParams', () => {
    const { parseQueryParams } = embedUtils;
    const testUrl =
      'https://example.com/app/embed/chefs-form-viewer-embed.js?form-id=123&api-key=abc&debug=true';
    const params = parseQueryParams(testUrl);
    expect(params['form-id']).toBe('123');
    expect(params['api-key']).toBe('abc');
    expect(params.debug).toBe('true');
  });

  it('should parse auto-reload-on-submit parameter correctly', () => {
    const { parseQueryParams, parseBooleanParam } = embedUtils;

    // Test with auto-reload enabled
    const enabledUrl =
      'https://example.com/app/embed/chefs-form-viewer-embed.js?form-id=123&auto-reload-on-submit=true';
    const enabledParams = parseQueryParams(enabledUrl);
    expect(enabledParams['auto-reload-on-submit']).toBe('true');
    expect(parseBooleanParam(enabledParams['auto-reload-on-submit'])).toBe(
      true
    );

    // Test with auto-reload disabled
    const disabledUrl =
      'https://example.com/app/embed/chefs-form-viewer-embed.js?form-id=123&auto-reload-on-submit=false';
    const disabledParams = parseQueryParams(disabledUrl);
    expect(disabledParams['auto-reload-on-submit']).toBe('false');
    expect(parseBooleanParam(disabledParams['auto-reload-on-submit'])).toBe(
      false
    );

    // Test without parameter (should use default)
    const defaultUrl =
      'https://example.com/app/embed/chefs-form-viewer-embed.js?form-id=123';
    const defaultParams = parseQueryParams(defaultUrl);
    expect(defaultParams['auto-reload-on-submit']).toBeUndefined();
  });

  it('should handle boolean parameter conversion using actual parseBooleanParam', () => {
    const { parseBooleanParam } = embedUtils;
    expect(parseBooleanParam('true')).toBe(true);
    expect(parseBooleanParam('1')).toBe(true);
    expect(parseBooleanParam('')).toBe(true);
    expect(parseBooleanParam('false')).toBe(false);
    expect(parseBooleanParam('0')).toBe(false);
    expect(parseBooleanParam(undefined)).toBe(false);
    expect(parseBooleanParam(null)).toBe(false);
    expect(parseBooleanParam('anything-else')).toBe(false);
    expect(parseBooleanParam('no')).toBe(false);
    expect(parseBooleanParam('off')).toBe(false);
  });

  it('should convert parameter names to attribute names using actual paramToAttribute', () => {
    const { paramToAttribute } = embedUtils;
    expect(paramToAttribute('formId')).toBe('form-id');
    expect(paramToAttribute('apiKey')).toBe('api-key');
    expect(paramToAttribute('readOnly')).toBe('read-only');
    expect(paramToAttribute('isolateStyles')).toBe('isolate-styles');
    expect(paramToAttribute('form-id')).toBe('form-id');
    expect(paramToAttribute('language')).toBe('language');
    expect(paramToAttribute('autoReloadOnSubmit')).toBe(
      'auto-reload-on-submit'
    );
  });

  it('should parse JSON parameters using actual parseJsonParam', () => {
    const { parseJsonParam } = embedUtils;
    const mockLogger = { warn: vi.fn() };
    const validJson = '{"sub":"user123","roles":["admin"]}';
    const parsed = parseJsonParam(validJson, 'token', mockLogger);
    expect(parsed).toEqual({ sub: 'user123', roles: ['admin'] });
    const invalidJson = '{"invalid": json}';
    const failed = parseJsonParam(invalidJson, 'token', mockLogger);
    expect(failed).toBe(null);
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('should create a logger using actual createLogger function', () => {
    const { createLogger } = embedUtils;
    const originalConsole = globalThis.console;
    const mockConsole = {
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };
    globalThis.console = mockConsole;
    try {
      const enabledLogger = createLogger(true);
      enabledLogger.info('test message', { data: 'test' });
      expect(mockConsole.info).toHaveBeenCalledWith(
        '[chefs-form-viewer-embed]',
        'test message',
        { data: 'test' }
      );
      mockConsole.info.mockClear();
      const disabledLogger = createLogger(false);
      disabledLogger.info('should not log');
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(typeof enabledLogger.debug).toBe('function');
      expect(typeof enabledLogger.info).toBe('function');
      expect(typeof enabledLogger.warn).toBe('function');
      expect(typeof enabledLogger.error).toBe('function');
    } finally {
      globalThis.console = originalConsole;
    }
  });

  it('should prefer auth-token over api-key in applyQueryParams', () => {
    const { applyQueryParams } = embedUtils;
    const logger = {
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    };
    const element = {};
    const params = {
      'form-id': 'abc',
      'auth-token': 'jwt-token',
      'api-key': 'api-key',
      'read-only': 'true',
      token: encodeURIComponent('{"sub":"user123"}'),
      user: encodeURIComponent('{"name":"John"}'),
      headers: encodeURIComponent('{"X-Custom-Header":"value"}'),
    };
    // Use a mock for setAttribute
    element.setAttribute = vi.fn();
    applyQueryParams(element, params, logger);
    // Should set form-id and auth-token, but skip api-key
    expect(element.setAttribute).toHaveBeenCalledWith('form-id', 'abc');
    expect(element.setAttribute).toHaveBeenCalledWith(
      'auth-token',
      'jwt-token'
    );
    expect(element.setAttribute).not.toHaveBeenCalledWith(
      'api-key',
      expect.anything()
    );
    // Should set read-only as boolean attribute
    expect(element.setAttribute).toHaveBeenCalledWith('read-only', '');
    // Should set token, user, and headers as properties
    expect(element.token).toEqual({ sub: 'user123' });
    expect(element.user).toEqual({ name: 'John' });
    expect(element.headers).toEqual({ 'X-Custom-Header': 'value' });
  });
});
