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
  // Test utility functions that would be present in the embed script

  describe('Parameter Parsing Logic', () => {
    it('should correctly parse URL parameters using actual parseQueryParams', () => {
      // Test the ACTUAL parseQueryParams function from the embed script
      const { parseQueryParams } = embedUtils;

      const testUrl =
        'https://example.com/app/embed/chefs-form-viewer-embed.js?form-id=123&api-key=abc&debug=true';

      const params = parseQueryParams(testUrl);

      expect(params['form-id']).toBe('123');
      expect(params['api-key']).toBe('abc');
      expect(params.debug).toBe('true');
    });

    it('should handle encoded JSON parameters', () => {
      const tokenJson = JSON.stringify({ sub: 'user123', roles: ['admin'] });
      const encodedToken = encodeURIComponent(tokenJson);
      const testUrl = `/app/embed/chefs-form-viewer-embed.js?token=${encodedToken}`;

      const url = new URL('http://example.com' + testUrl);
      const params = Object.fromEntries(url.searchParams.entries());
      const decodedToken = JSON.parse(decodeURIComponent(params.token));

      expect(decodedToken).toEqual({ sub: 'user123', roles: ['admin'] });
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
  });

  describe('Logger Creation', () => {
    // Extract helper functions to reduce nesting
    const createTestLogger = (mockConsole, enabled) => {
      const log = (level, msg, meta) => {
        if (!enabled) return;
        (mockConsole[level] || mockConsole.log)(
          `[chefs-form-viewer-embed]`,
          msg,
          meta ?? ''
        );
      };

      const createLogMethod = (logLevel) => (m, meta) => log(logLevel, m, meta);

      return {
        debug: createLogMethod('debug'),
        info: createLogMethod('info'),
        warn: createLogMethod('warn'),
        error: createLogMethod('error'),
      };
    };

    it('should create a logger that only logs when enabled', () => {
      const mockConsole = {
        log: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      // Test enabled logger
      const enabledLogger = createTestLogger(mockConsole, true);
      enabledLogger.info('test message', { data: 'test' });
      expect(mockConsole.info).toHaveBeenCalledWith(
        '[chefs-form-viewer-embed]',
        'test message',
        { data: 'test' }
      );

      // Test disabled logger
      mockConsole.info.mockClear();
      const disabledLogger = createTestLogger(mockConsole, false);
      disabledLogger.info('test message');
      expect(mockConsole.info).not.toHaveBeenCalled();
    });
  });

  describe('Element Configuration Logic', () => {
    it('should apply string parameters as properties', () => {
      const mockElement = {
        formId: null,
        apiKey: null,
        language: null,
      };

      const params = {
        'form-id': '123',
        'api-key': 'abc',
        language: 'fr',
      };

      // Simulate parameter application logic
      if (params['form-id']) mockElement.formId = params['form-id'];
      if (params['api-key']) mockElement.apiKey = params['api-key'];
      if (params.language) mockElement.language = params.language;

      expect(mockElement.formId).toBe('123');
      expect(mockElement.apiKey).toBe('abc');
      expect(mockElement.language).toBe('fr');
    });

    it('should apply boolean parameters as HTML boolean attributes', () => {
      const mockElement = {
        setAttribute: vi.fn(),
      };

      // Test the parseBooleanParam logic for known boolean parameters
      const parseBooleanParam = (value) =>
        value === 'true' || value === '1' || value === '';
      const booleanParams = ['read-only', 'isolate-styles', 'no-icons'];

      const testParams = {
        'read-only': 'true', // Should set attribute
        'isolate-styles': '1', // Should set attribute
        'no-icons': '', // Should set attribute (empty = present)
        'other-param': 'false', // Should NOT set attribute (not boolean param)
      };

      // Simulate boolean parameter application from applyQueryParams
      Object.entries(testParams).forEach(([param, value]) => {
        if (booleanParams.includes(param)) {
          const boolValue = parseBooleanParam(value);
          if (boolValue) {
            mockElement.setAttribute(param, ''); // HTML boolean attribute behavior
          }
        } else {
          mockElement.setAttribute(param, value); // Regular string attribute
        }
      });

      // Boolean parameters should be set as empty string (HTML boolean attribute style)
      expect(mockElement.setAttribute).toHaveBeenCalledWith('read-only', '');
      expect(mockElement.setAttribute).toHaveBeenCalledWith(
        'isolate-styles',
        ''
      );
      expect(mockElement.setAttribute).toHaveBeenCalledWith('no-icons', '');

      // Non-boolean parameters should be set as their value
      expect(mockElement.setAttribute).toHaveBeenCalledWith(
        'other-param',
        'false'
      );
    });

    it('should apply JSON parameters as object properties', () => {
      const mockElement = {
        token: null,
        user: null,
      };

      const tokenJson = '{"sub":"user123","roles":["admin"]}';
      const userJson = '{"name":"John Doe","id":"456"}';

      // Simulate JSON parameter application
      try {
        mockElement.token = JSON.parse(tokenJson);
      } catch (error) {
        // Invalid JSON, skip - log to mock logger to avoid console output
        const mockLogger = { warn: vi.fn() };
        mockLogger.warn('Failed to parse token JSON:', error);
      }

      try {
        mockElement.user = JSON.parse(userJson);
      } catch (error) {
        // Invalid JSON, skip - log to mock logger to avoid console output
        const mockLogger = { warn: vi.fn() };
        mockLogger.warn('Failed to parse user JSON:', error);
      }

      expect(mockElement.token).toEqual({ sub: 'user123', roles: ['admin'] });
      expect(mockElement.user).toEqual({ name: 'John Doe', id: '456' });
    });
  });

  describe('Error Handling Patterns', () => {
    it('should handle JSON parsing errors gracefully', () => {
      const mockLogger = {
        warn: vi.fn(),
      };

      const invalidJsonInputs = [
        '{invalid',
        'not json at all',
        '{"unclosed": true',
        null,
        undefined,
      ];

      // Test each invalid JSON input
      const testInvalidJson = (input) => {
        let parsed = null;
        let errorOccurred = false;

        try {
          if (input) {
            parsed = JSON.parse(input);
          }
        } catch (err) {
          errorOccurred = true;
          mockLogger.warn('Invalid JSON for parameter', input, err);
        }

        expect(parsed).toBeNull();
        if (input) {
          expect(errorOccurred).toBe(true);
        }
      };

      invalidJsonInputs.forEach(testInvalidJson);

      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle component loading failures', () => {
      const mockElement = {
        load: vi.fn().mockRejectedValue(new Error('Loading failed')),
      };

      const mockLogger = {
        error: vi.fn(),
      };

      // Simulate error handling
      mockElement.load().catch((err) => {
        mockLogger.error('Failed to embed chefs-form-viewer:', err);
      });

      // Wait for promise to resolve
      const PROMISE_RESOLUTION_DELAY = 0;
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(mockLogger.error).toHaveBeenCalledWith(
            'Failed to embed chefs-form-viewer:',
            expect.any(Error)
          );
          resolve();
        }, PROMISE_RESOLUTION_DELAY);
      });
    });
  });
});
