/* eslint-env jest */

const { validatePermissionsLogic } = require('../../../../../../src/runtime-auth/security/auth/utils/validatePermissions');

describe('auth/utils/validatePermissions', () => {
  it('should return valid when no permissions required', () => {
    const result = validatePermissionsLogic([], ['perm1', 'perm2']);
    expect(result.isValid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('should return valid when all required permissions are granted (all mode)', () => {
    const result = validatePermissionsLogic(['perm1', 'perm2'], ['perm1', 'perm2', 'perm3'], 'all');
    expect(result.isValid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('should return invalid when some permissions are missing (all mode)', () => {
    const result = validatePermissionsLogic(['perm1', 'perm2', 'perm3'], ['perm1', 'perm2'], 'all');
    expect(result.isValid).toBe(false);
    expect(result.missing).toEqual(['perm3']);
  });

  it('should return invalid when no permissions are granted (all mode)', () => {
    const result = validatePermissionsLogic(['perm1', 'perm2'], [], 'all');
    expect(result.isValid).toBe(false);
    expect(result.missing).toEqual(['perm1', 'perm2']);
  });

  it('should return valid when at least one permission is granted (any mode)', () => {
    const result = validatePermissionsLogic(['perm1', 'perm2'], ['perm2'], 'any');
    expect(result.isValid).toBe(true);
    expect(result.missing).toEqual(['perm1']);
  });

  it('should return invalid when no permissions are granted (any mode)', () => {
    const result = validatePermissionsLogic(['perm1', 'perm2'], [], 'any');
    expect(result.isValid).toBe(false);
    expect(result.missing).toEqual(['perm1', 'perm2']);
  });

  it('should default to all mode when mode not specified', () => {
    const result = validatePermissionsLogic(['perm1', 'perm2'], ['perm1']);
    expect(result.isValid).toBe(false);
    expect(result.missing).toEqual(['perm2']);
  });

  it('should handle non-array inputs gracefully', () => {
    const result1 = validatePermissionsLogic(null, ['perm1']);
    expect(result1.isValid).toBe(true);
    expect(result1.missing).toEqual([]);

    const result2 = validatePermissionsLogic(['perm1'], null);
    expect(result2.isValid).toBe(false);
    expect(result2.missing).toEqual(['perm1']);
  });

  it('should handle empty arrays', () => {
    const result = validatePermissionsLogic([], []);
    expect(result.isValid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('should handle duplicate permissions', () => {
    const result = validatePermissionsLogic(['perm1', 'perm1'], ['perm1'], 'all');
    expect(result.isValid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('should handle case sensitivity', () => {
    const result = validatePermissionsLogic(['Perm1'], ['perm1'], 'all');
    expect(result.isValid).toBe(false);
    expect(result.missing).toEqual(['Perm1']);
  });
});
