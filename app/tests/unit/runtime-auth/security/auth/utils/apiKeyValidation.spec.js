/* eslint-env jest */

const { safeCompare, validateApiKey } = require('../../../../../../src/runtime-auth/security/auth/utils/apiKeyValidation');
const ERRORS = require('../../../../../../src/runtime-auth/security/errorMessages');

describe('auth/utils/apiKeyValidation', () => {
  it('should return true for identical strings', () => {
    expect(safeCompare('test', 'test')).toBe(true);
    expect(safeCompare('', '')).toBe(true);
  });

  it('should return false for different strings', () => {
    expect(safeCompare('test', 'different')).toBe(false);
    expect(safeCompare('test', 'TEST')).toBe(false);
  });

  it('should return false for strings of different lengths', () => {
    expect(safeCompare('test', 'testing')).toBe(false);
    expect(safeCompare('short', 'verylongstring')).toBe(false);
  });

  it('should return false for null or undefined inputs', () => {
    expect(safeCompare(null, 'test')).toBe(false);
    expect(safeCompare('test', null)).toBe(false);
    expect(safeCompare(undefined, 'test')).toBe(false);
    expect(safeCompare('test', undefined)).toBe(false);
  });

  it('should handle empty strings', () => {
    expect(safeCompare('', 'test')).toBe(false);
    expect(safeCompare('test', '')).toBe(false);
  });

  it('should be timing-safe for same length strings', () => {
    const start = Date.now();
    safeCompare('test', 'different');
    const end = Date.now();
    expect(end - start).toBeLessThan(10);
  });

  it('should return true for valid API key', () => {
    const apiKeyRecord = { secret: 'valid-secret' };
    expect(validateApiKey('valid-secret', apiKeyRecord)).toBe(true);
  });

  it('should throw error when apiKeyRecord is null', () => {
    expect(() => validateApiKey('test-key', null)).toThrow(ERRORS.FORM_OR_API_KEY_NOT_FOUND);
  });

  it('should throw error when apiKeyRecord is undefined', () => {
    expect(() => validateApiKey('test-key', undefined)).toThrow(ERRORS.FORM_OR_API_KEY_NOT_FOUND);
  });

  it('should throw error when apiKeyRecord has no secret', () => {
    const apiKeyRecord = {};
    expect(() => validateApiKey('test-key', apiKeyRecord)).toThrow(ERRORS.FORM_OR_API_KEY_NOT_FOUND);
  });

  it('should throw error when apiKeyRecord secret is null', () => {
    const apiKeyRecord = { secret: null };
    expect(() => validateApiKey('test-key', apiKeyRecord)).toThrow(ERRORS.FORM_OR_API_KEY_NOT_FOUND);
  });

  it('should throw error when provided key does not match', () => {
    const apiKeyRecord = { secret: 'correct-secret' };
    expect(() => validateApiKey('wrong-secret', apiKeyRecord)).toThrow(ERRORS.INVALID_CREDENTIALS);
  });

  it('should throw error with 401 status', () => {
    const apiKeyRecord = { secret: 'correct-secret' };
    try {
      validateApiKey('wrong-secret', apiKeyRecord);
      throw new Error('Should have thrown');
    } catch (error) {
      expect(error.status).toBe(401);
    }
  });

  it('should handle case sensitivity', () => {
    const apiKeyRecord = { secret: 'Secret-Key' };
    expect(() => validateApiKey('secret-key', apiKeyRecord)).toThrow(ERRORS.INVALID_CREDENTIALS);
  });
});
