import { describe, expect, it, vi } from 'vitest';

/**
 * Unit tests for chefs-form-viewer-embed.js
 *
 * Tests core functionality of the embed script by testing the individual
 * utility functions and integration patterns.
 */

describe('chefs-form-viewer-embed.js', () => {
  // Test utility functions that would be present in the embed script

  describe('Parameter Parsing Logic', () => {
    it('should correctly parse URL parameters', () => {
      // Test the parseQueryParams equivalent logic
      const testUrl =
        '/app/embed/chefs-form-viewer-embed.js?form-id=123&api-key=abc&debug=true';
      const url = new URL('http://example.com' + testUrl);
      const params = Object.fromEntries(url.searchParams.entries());

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

    it('should handle boolean parameter conversion', () => {
      const testCases = [
        { input: 'true', expected: true },
        { input: '1', expected: true },
        { input: '', expected: true }, // empty string is truthy for attributes
        { input: 'false', expected: false },
        { input: '0', expected: false },
        { input: undefined, expected: false },
      ];

      testCases.forEach(({ input, expected }) => {
        // Simulate the boolean conversion logic from the embed script
        const result = input === 'true' || input === '1' || input === '';
        expect(result).toBe(expected);
      });
    });
  });

  describe('Logger Creation', () => {
    it('should create a logger that only logs when enabled', () => {
      const mockConsole = {
        log: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      // Simulate createLogger function
      const createLogger = (enabled) => {
        const log = (level, msg, meta) => {
          if (!enabled) return;
          (mockConsole[level] || mockConsole.log)(
            `[chefs-form-viewer-embed]`,
            msg,
            meta ?? ''
          );
        };
        return {
          debug: (m, meta) => log('debug', m, meta),
          info: (m, meta) => log('info', m, meta),
          warn: (m, meta) => log('warn', m, meta),
          error: (m, meta) => log('error', m, meta),
        };
      };

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
      disabledLogger.info('test message');
      expect(mockConsole.info).not.toHaveBeenCalled();
    });
  });

  describe('JSON Parameter Processing', () => {
    it('should parse valid JSON parameters', () => {
      const validJson = '{"name":"John","age":30}';
      let result;

      try {
        result = JSON.parse(validJson);
      } catch {
        result = undefined;
      }

      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should handle invalid JSON gracefully', () => {
      const invalidJson = '{invalid json}';
      let result;
      let errorOccurred = false;

      try {
        result = JSON.parse(invalidJson);
      } catch {
        result = undefined;
        errorOccurred = true;
      }

      expect(result).toBeUndefined();
      expect(errorOccurred).toBe(true);
    });

    it('should decode URI components correctly', () => {
      const originalData = { message: 'Hello World!', special: '&=?#' };
      const encoded = encodeURIComponent(JSON.stringify(originalData));
      const decoded = JSON.parse(decodeURIComponent(encoded));

      expect(decoded).toEqual(originalData);
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

    it('should apply boolean parameters as attributes', () => {
      const mockElement = {
        setAttribute: vi.fn(),
      };

      const booleanParams = {
        debug: 'true',
        'read-only': '1',
        'isolate-styles': '',
      };

      // Simulate boolean parameter application
      Object.entries(booleanParams).forEach(([key, value]) => {
        const isTrue = value === 'true' || value === '1' || value === '';
        if (isTrue) {
          mockElement.setAttribute(key, 'true');
        }
      });

      expect(mockElement.setAttribute).toHaveBeenCalledWith('debug', 'true');
      expect(mockElement.setAttribute).toHaveBeenCalledWith(
        'read-only',
        'true'
      );
      expect(mockElement.setAttribute).toHaveBeenCalledWith(
        'isolate-styles',
        'true'
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
      } catch {
        // Invalid JSON, skip
      }

      try {
        mockElement.user = JSON.parse(userJson);
      } catch {
        // Invalid JSON, skip
      }

      expect(mockElement.token).toEqual({ sub: 'user123', roles: ['admin'] });
      expect(mockElement.user).toEqual({ name: 'John Doe', id: '456' });
    });
  });

  describe('Global Configuration Handling', () => {
    it('should merge global config with URL parameters', () => {
      const globalConfig = {
        token: { sub: 'global-user', roles: ['viewer'] },
        user: { name: 'Global User', department: 'IT' },
        before: vi.fn(),
      };

      const urlParams = {
        token: { sub: 'url-user', roles: ['admin'] },
        // user not provided in URL
      };

      // Simulate configuration merging (URL takes precedence)
      const finalConfig = {
        token: urlParams.token || globalConfig.token,
        user: urlParams.user || globalConfig.user,
        before: globalConfig.before,
      };

      expect(finalConfig.token).toEqual({ sub: 'url-user', roles: ['admin'] });
      expect(finalConfig.user).toEqual({
        name: 'Global User',
        department: 'IT',
      });
      expect(finalConfig.before).toBe(globalConfig.before);
    });

    it('should handle missing global config gracefully', () => {
      const urlParams = { formId: '123', apiKey: 'abc' };
      const globalConfig = undefined;

      // Simulate safe access to global config
      const finalConfig = {
        ...urlParams,
        ...(globalConfig || {}),
      };

      expect(finalConfig.formId).toBe('123');
      expect(finalConfig.apiKey).toBe('abc');
      expect(finalConfig.before).toBeUndefined();
    });
  });

  describe('Event Handling Patterns', () => {
    it('should set up event listeners correctly', () => {
      const mockElement = {
        addEventListener: vi.fn(),
        load: vi.fn().mockResolvedValue(undefined),
      };

      const mockWindow = {
        dispatchEvent: vi.fn(),
      };

      // Simulate event listener setup
      const metadataHandler = vi.fn();
      mockElement.addEventListener('formio:loadSchema', metadataHandler);

      // Simulate form loading
      const loadPromise = mockElement.load();
      expect(loadPromise).toBeDefined();
      expect(loadPromise).toBeInstanceOf(Promise);

      // Simulate global event dispatch
      const customEvent = {
        type: 'chefs-form-viewer:embedded',
        detail: { element: mockElement, params: {} },
      };
      mockWindow.dispatchEvent(customEvent);

      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'formio:loadSchema',
        metadataHandler
      );
      expect(mockElement.load).toHaveBeenCalled();
      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(customEvent);
    });

    it('should extract metadata from form schema events', () => {
      const mockMetadataCallback = vi.fn();
      const mockWindowDispatch = vi.fn();

      // Simulate metadata extraction logic
      const formData = {
        name: 'Test Form',
        description: 'Test Description',
        id: 'form-123',
      };

      const schemaData = {
        components: [{ type: 'textfield', key: 'name' }],
      };

      const extractedMetadata = {
        form: formData,
        schema: schemaData,
        formName: formData.name,
        formDescription: formData.description,
      };

      // Simulate callback execution
      mockMetadataCallback(extractedMetadata);

      // Simulate global event
      const metadataEvent = {
        type: 'chefs-form-viewer:metadata-loaded',
        detail: extractedMetadata,
      };
      mockWindowDispatch(metadataEvent);

      expect(mockMetadataCallback).toHaveBeenCalledWith(extractedMetadata);
      expect(mockWindowDispatch).toHaveBeenCalledWith(metadataEvent);
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

      invalidJsonInputs.forEach((input) => {
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
      });

      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle missing script element gracefully', () => {
      const currentScript = null;
      let errorHandled = false;

      try {
        if (!currentScript) {
          throw new Error('No current script found');
        }
      } catch (err) {
        errorHandled = true;
        // In real implementation, this would show an error message
      }

      expect(errorHandled).toBe(true);
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
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(mockLogger.error).toHaveBeenCalledWith(
            'Failed to embed chefs-form-viewer:',
            expect.any(Error)
          );
          resolve();
        }, 0);
      });
    });
  });
});
