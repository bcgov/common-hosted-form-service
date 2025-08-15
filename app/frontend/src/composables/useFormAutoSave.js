import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/auth';

const STORAGE_PREFIX = 'chefs_autosave';
const DEBOUNCE_DELAY = 2000; // 2 seconds

// Schema validation for saved data
function isValidSavedData(data) {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.timestamp === 'number' &&
    typeof data.version === 'string' &&
    data.data &&
    typeof data.data === 'object'
  );
}

export function useFormAutoSave() {
  const authStore = useAuthStore();
  const { authenticated, user } = storeToRefs(authStore);

  // Create storage key for authenticated users
  function createStorageKey(formId, version) {
    // Input validation
    if (!formId || typeof formId !== 'string') {
      throw new Error('Invalid formId provided');
    }
    if (!version || typeof version !== 'string') {
      throw new Error('Invalid version provided');
    }

    // Auto-save is only available for authenticated users
    if (!authenticated.value || !user.value?.idpUserId) {
      throw new Error('Auto-save is only available for authenticated users');
    }

    return `${STORAGE_PREFIX}_${formId}_v${version}_user_${user.value.idpUserId}`;
  }

  // Check if localStorage is supported and available
  function isStorageSupported() {
    try {
      if (
        typeof Storage === 'undefined' ||
        typeof localStorage === 'undefined'
      ) {
        return false;
      }
      const testKey = 'chefs_storage_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      // Storage may be disabled in private/incognito mode or full
      return false;
    }
  }

  // Save form data to localStorage
  function saveFormData(formId, version, data, formName = '') {
    if (!isStorageSupported())
      return { success: false, error: 'Storage not supported' };

    // Validate input data
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid form data' };
    }

    // Declare variables outside try block for catch block access
    let storageKey;
    let saveData;
    let dataString;

    try {
      storageKey = createStorageKey(formId, version);
      saveData = {
        data,
        timestamp: Date.now(),
        formName,
        version,
      };

      dataString = JSON.stringify(saveData);

      // Check if localStorage has enough space (approximate check)
      if (dataString.length > 1024 * 1024) {
        // > 1MB
        return { success: false, error: 'Data too large for auto-save' };
      }

      localStorage.setItem(storageKey, dataString);
      return { success: true };
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // Try cleanup and retry once
        cleanupOldAutoSaves(1); // Aggressive cleanup - 1 hour
        try {
          localStorage.setItem(storageKey, dataString);
          return { success: true };
        } catch (retryError) {
          return { success: false, error: 'Storage quota exceeded' };
        }
      }
      return { success: false, error: `Save failed: ${error.message}` };
    }
  }

  // Check if auto-saved data exists
  function hasAutoSavedData(formId, version) {
    if (!isStorageSupported()) return false;

    try {
      const storageKey = createStorageKey(formId, version);
      const savedData = localStorage.getItem(storageKey);
      return savedData !== null;
    } catch (error) {
      return false;
    }
  }

  // Retrieve auto-saved data
  function getAutoSavedData(formId, version) {
    if (!isStorageSupported())
      return { data: null, error: 'Storage not supported' };

    try {
      const storageKey = createStorageKey(formId, version);
      const savedData = localStorage.getItem(storageKey);

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Validate the data structure before returning
        if (isValidSavedData(parsedData)) {
          return { data: parsedData, error: null };
        } else {
          // Remove corrupted data
          localStorage.removeItem(storageKey);
          return { data: null, error: 'Corrupted auto-save data removed' };
        }
      }
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: `Failed to retrieve data: ${error.message}` };
    }
  }

  // Clear auto-saved data
  function clearAutoSavedData(formId, version) {
    if (!isStorageSupported()) return false;

    try {
      const storageKey = createStorageKey(formId, version);
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Create debounced save function with error callback
  function createDebouncedSave(formId, version, formName = '', onError = null) {
    let timeoutId = null;

    const debouncedFunction = function (data) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        const result = saveFormData(formId, version, data, formName);
        if (!result.success && onError && typeof onError === 'function') {
          onError(result.error);
        }
      }, DEBOUNCE_DELAY);
    };

    // Add cleanup method
    debouncedFunction.cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    return debouncedFunction;
  }

  // Clean up old auto-save entries (optional utility)
  function cleanupOldAutoSaves(maxAgeHours = 24) {
    if (!isStorageSupported()) return;

    try {
      const cutoffTime = Date.now() - maxAgeHours * 60 * 60 * 1000;
      const keysToRemove = [];

      // More efficient: only get our keys instead of iterating all localStorage
      Object.keys(localStorage)
        .filter((key) => key.startsWith(STORAGE_PREFIX))
        .forEach((key) => {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (!data.timestamp || data.timestamp < cutoffTime) {
              keysToRemove.push(key);
            }
          } catch (error) {
            // If we can't parse the data, it's probably corrupted, so remove it
            keysToRemove.push(key);
          }
        });

      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Silently clean up old entries
    } catch (error) {
      // Cleanup failure is not critical, continue silently
    }
  }

  return {
    createDebouncedSave,
    hasAutoSavedData,
    getAutoSavedData,
    clearAutoSavedData,
    isStorageSupported,
    cleanupOldAutoSaves,
    saveFormData,
  };
}
