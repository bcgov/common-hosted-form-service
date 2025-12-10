// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalAutosave } from '~/composables/useLocalAutosave';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useLocalAutosave', () => {
  const STORAGE_PREFIX = 'chefs_autosave_';
  const formId = '123-456';
  const userId = 'USER123';
  const submissionId = 'SUB456';
  const testData = { field1: 'value1', field2: 'value2' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Reset localStorage mock to working state
    localStorageMock.getItem.mockImplementation(() => null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('init', () => {
    it('should initialize with formId and userId', () => {
      const autosave = useLocalAutosave();

      expect(() => {
        autosave.init({
          formId: formId,
          userId: userId,
        });
      }).not.toThrow();
    });

    it('should initialize with all parameters including submissionId', () => {
      const autosave = useLocalAutosave();

      expect(() => {
        autosave.init({
          formId: formId,
          userId: userId,
          submissionId: submissionId,
        });
      }).not.toThrow();
    });

    it('should support legacy API with formId as string', () => {
      const autosave = useLocalAutosave();

      expect(() => {
        autosave.init(formId, { userId: userId });
      }).not.toThrow();
    });

    it('should throw error if formId is not provided', () => {
      const autosave = useLocalAutosave();

      expect(() => {
        autosave.init({ userId: userId });
      }).toThrow('formId is required for local autosave');
    });

    it('should run cleanup on initialization', () => {
      const autosave = useLocalAutosave();

      // Mock localStorage to have old keys
      localStorageMock.key.mockImplementation((index) => {
        if (index === 0) return `${STORAGE_PREFIX}old_form:old_user`;
        return null;
      });
      localStorageMock.length = 1;

      autosave.init({ formId: formId, userId: userId });

      // Cleanup checks should have been initiated
      expect(localStorageMock.getItem).toBeCalled();
    });
  });

  describe('save', () => {
    it('should not save if localStorage is unavailable', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      expect(() => {
        autosave.save(testData);
        vi.advanceTimersByTime(3000);
      }).not.toThrow();
    });

    it('should not save if not initialized', () => {
      const autosave = useLocalAutosave();

      autosave.save(testData);
      vi.advanceTimersByTime(3000);

      expect(localStorageMock.setItem).not.toBeCalled();
    });
  });

  describe('load', () => {
    it('should load saved data from localStorage', () => {
      const savedData = {
        timestamp: new Date().toISOString(),
        data: testData,
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));

      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      const loaded = autosave.load();

      expect(loaded).toEqual(savedData);
      expect(localStorageMock.getItem).toBeCalledWith(
        `${STORAGE_PREFIX}${formId}:${userId}`
      );
    });

    it('should return null if no data exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      const loaded = autosave.load();

      expect(loaded).toBeNull();
    });

    it('should return null if data is invalid JSON', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      const loaded = autosave.load();

      expect(loaded).toBeNull();
    });

    it('should return null if data structure is invalid', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({ invalid: 'structure' })
      );

      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      const loaded = autosave.load();

      expect(loaded).toBeNull();
    });

    it('should return null if not initialized', () => {
      const autosave = useLocalAutosave();

      const loaded = autosave.load();

      expect(loaded).toBeNull();
      expect(localStorageMock.getItem).not.toBeCalled();
    });
  });

  describe('clear', () => {
    it('should remove data from localStorage', () => {
      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      autosave.clear();

      expect(localStorageMock.removeItem).toBeCalledWith(
        `${STORAGE_PREFIX}${formId}:${userId}`
      );
    });

    it('should handle errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      expect(() => autosave.clear()).not.toThrow();
    });

    it('should not throw if not initialized', () => {
      const autosave = useLocalAutosave();

      expect(() => autosave.clear()).not.toThrow();
      expect(localStorageMock.removeItem).not.toBeCalled();
    });
  });

  describe('exists', () => {
    it('should return true if data exists', () => {
      const savedData = {
        timestamp: new Date().toISOString(),
        data: testData,
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));

      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      expect(autosave.exists()).toBe(true);
    });

    it('should return false if no data exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      expect(autosave.exists()).toBe(false);
    });

    it('should return false if not initialized', () => {
      const autosave = useLocalAutosave();

      expect(autosave.exists()).toBe(false);
    });
  });

  describe('shouldShowRecoveryDialog', () => {
    it('should return true if local data exists and no server submission', () => {
      const savedData = {
        timestamp: new Date().toISOString(),
        data: testData,
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));

      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      expect(autosave.shouldShowRecoveryDialog(null)).toBe(true);
    });

    it('should return true if local data is newer than server data', () => {
      const now = new Date();
      const localTime = new Date(now.getTime() + 10000); // 10 seconds newer

      const savedData = {
        timestamp: localTime.toISOString(),
        data: testData,
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));

      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      const serverSubmission = {
        updatedAt: now.toISOString(),
      };

      expect(autosave.shouldShowRecoveryDialog(serverSubmission)).toBe(true);
    });

    it('should return false if server data is newer than local data', () => {
      const now = new Date();
      const localTime = new Date(now.getTime() - 10000); // 10 seconds older

      const savedData = {
        timestamp: localTime.toISOString(),
        data: testData,
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));

      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      const serverSubmission = {
        updatedAt: now.toISOString(),
      };

      expect(autosave.shouldShowRecoveryDialog(serverSubmission)).toBe(false);
    });

    it('should return false if no local data exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      expect(autosave.shouldShowRecoveryDialog({})).toBe(false);
    });

    it('should return false if timestamps are invalid', () => {
      const savedData = {
        timestamp: 'invalid-date',
        data: testData,
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));

      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      const serverSubmission = {
        updatedAt: 'also-invalid',
      };

      expect(autosave.shouldShowRecoveryDialog(serverSubmission)).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should be safe to call multiple times', () => {
      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      expect(() => {
        autosave.cleanup();
        autosave.cleanup();
      }).not.toThrow();
    });
  });

  describe('_isPending', () => {
    it('should return true when save is pending', () => {
      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      autosave.save(testData);

      expect(autosave._isPending()).toBe(true);
    });

    it('should return false after save completes', () => {
      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      autosave.save(testData);
      vi.advanceTimersByTime(3000);

      expect(autosave._isPending()).toBe(false);
    });

    it('should return false after cleanup', () => {
      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      autosave.save(testData);
      autosave.cleanup();

      expect(autosave._isPending()).toBe(false);
    });
  });

  describe('localStorage unavailable scenarios', () => {
    it('should handle when localStorage is undefined', () => {
      const originalLocalStorage = globalThis.localStorage;
      delete globalThis.localStorage;

      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      expect(() => {
        autosave.save(testData);
        autosave.load();
        autosave.clear();
      }).not.toThrow();

      globalThis.localStorage = originalLocalStorage;
    });

    it('should handle private browsing mode (storage quota exceeded)', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      expect(() => {
        autosave.save(testData);
        vi.advanceTimersByTime(3000);
      }).not.toThrow();
    });
  });

  describe('expiry and cleanup', () => {
    it('should remove expired entries during cleanup', () => {
      const oldTimestamp = new Date();
      oldTimestamp.setHours(oldTimestamp.getHours() - 25); // 25 hours old (past 24 hour expiry)

      const expiredData = {
        timestamp: oldTimestamp.toISOString(),
        data: testData,
      };

      // Mock localStorage to return expired data
      localStorageMock.key.mockImplementation((index) => {
        if (index === 0) return `${STORAGE_PREFIX}old_form:old_user`;
        return null;
      });
      localStorageMock.length = 1;
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === `${STORAGE_PREFIX}old_form:old_user`) {
          return JSON.stringify(expiredData);
        }
        return null;
      });

      const autosave = useLocalAutosave();
      autosave.init({ formId: formId, userId: userId });

      // Expired key should be removed
      expect(localStorageMock.removeItem).toBeCalledWith(
        `${STORAGE_PREFIX}old_form:old_user`
      );
    });
  });
});
