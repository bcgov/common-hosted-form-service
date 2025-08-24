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
    // Test the ACTUAL parseQueryParams function from the embed script
    const { parseQueryParams } = embedUtils;

    const testUrl =
      'https://example.com/app/embed/chefs-form-viewer-embed.js?form-id=123&api-key=abc&debug=true';

    const params = parseQueryParams(testUrl);

    expect(params['form-id']).toBe('123');
    expect(params['api-key']).toBe('abc');
    expect(params.debug).toBe('true');
  });

  it('should handle boolean parameter conversion using actual parseBooleanParam', () => {
    // Test the ACTUAL parseBooleanParam function from the embed script
    const { parseBooleanParam } = embedUtils;

    // Test truthy values (following HTML attribute conventions)
    expect(parseBooleanParam('true')).toBe(true);
    expect(parseBooleanParam('1')).toBe(true);
    expect(parseBooleanParam('')).toBe(true); // empty string means attribute present

    // Test falsy values
    expect(parseBooleanParam('false')).toBe(false);
    expect(parseBooleanParam('0')).toBe(false);
    expect(parseBooleanParam(undefined)).toBe(false);
    expect(parseBooleanParam(null)).toBe(false);
    expect(parseBooleanParam('anything-else')).toBe(false);
    expect(parseBooleanParam('no')).toBe(false);
    expect(parseBooleanParam('off')).toBe(false);
  });

  it('should convert parameter names to attribute names using actual paramToAttribute', () => {
    // Test the ACTUAL paramToAttribute function from the embed script
    const { paramToAttribute } = embedUtils;

    expect(paramToAttribute('formId')).toBe('form-id');
    expect(paramToAttribute('apiKey')).toBe('api-key');
    expect(paramToAttribute('readOnly')).toBe('read-only');
    expect(paramToAttribute('isolateStyles')).toBe('isolate-styles');
    expect(paramToAttribute('form-id')).toBe('form-id'); // already kebab-case
    expect(paramToAttribute('language')).toBe('language'); // no change needed
  });

  it('should parse JSON parameters using actual parseJsonParam', () => {
    // Test the ACTUAL parseJsonParam function from the embed script
    const { parseJsonParam } = embedUtils;

    const mockLogger = { warn: vi.fn() };

    // Valid JSON
    const validJson = '{"sub":"user123","roles":["admin"]}';
    const parsed = parseJsonParam(validJson, 'token', mockLogger);
    expect(parsed).toEqual({ sub: 'user123', roles: ['admin'] });

    // Invalid JSON
    const invalidJson = '{"invalid": json}';
    const failed = parseJsonParam(invalidJson, 'token', mockLogger);
    expect(failed).toBe(null);
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('should create a logger using actual createLogger function', () => {
    // Test the ACTUAL createLogger function from the embed script
    const { createLogger } = embedUtils;

    const originalConsole = global.console;
    const mockConsole = {
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };
    global.console = mockConsole;

    try {
      // Test enabled logger
      const enabledLogger = createLogger(true);
      enabledLogger.info('test message', { data: 'test' });

      expect(mockConsole.info).toHaveBeenCalledWith(
        '[chefs-form-viewer-embed]',
        'test message',
        { data: 'test' }
      );

      // Test disabled logger
      mockConsole.info.mockClear();
      const disabledLogger = createLogger(false);
      disabledLogger.info('should not log');
      expect(mockConsole.info).not.toHaveBeenCalled();

      // Test logger methods exist
      expect(typeof enabledLogger.debug).toBe('function');
      expect(typeof enabledLogger.info).toBe('function');
      expect(typeof enabledLogger.warn).toBe('function');
      expect(typeof enabledLogger.error).toBe('function');
    } finally {
      global.console = originalConsole;
    }
  });
});
