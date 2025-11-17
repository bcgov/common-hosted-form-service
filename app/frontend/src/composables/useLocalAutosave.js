/**
 * Simple local crash-recovery autosave
 * Stores form data in localStorage for crash protection only
 * Does NOT interact with backend drafts or submissions
 */

const STORAGE_PREFIX = 'chefs_autosave_';
const DEBOUNCE_DELAY = 3000; // 3 seconds

export function useLocalAutosave() {
  let currentFormId = null;
  let debounceTimeout = null;

  /**
   * Initialize autosave for a specific form
   * @param {string} formId - The form ID
   */
  function init(formId) {
    if (!formId) {
      throw new Error('formId is required');
    }
    currentFormId = formId;
  }

  /**
   * Get the storage key for current form
   * @returns {string}
   */
  function getStorageKey() {
    if (!currentFormId) {
      throw new Error('Autosave not initialized. Call init() first.');
    }
    return `${STORAGE_PREFIX}${currentFormId}`;
  }

  /**
   * Check if localStorage is available
   * @returns {boolean}
   */
  function isStorageAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Save form data to localStorage (debounced)
   * @param {Object} formData - The form data to save
   */
  function save(formData) {
    if (!isStorageAvailable()) {
      return;
    }

    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Debounce the save
    debounceTimeout = setTimeout(() => {
      try {
        const payload = {
          timestamp: new Date().toISOString(),
          data: formData,
        };

        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch (error) {
        // Silent failure - localStorage might be full or disabled
      }
    }, DEBOUNCE_DELAY);
  }

  /**
   * Load autosaved data from localStorage
   * @returns {Object|null} - { timestamp: string, data: object } or null
   */
  function load() {
    if (!isStorageAvailable()) {
      return null;
    }

    try {
      const storageKey = getStorageKey();
      const saved = localStorage.getItem(storageKey);

      if (!saved) {
        return null;
      }

      const parsed = JSON.parse(saved);

      // Validate structure
      if (
        parsed &&
        typeof parsed === 'object' &&
        parsed.timestamp &&
        parsed.data &&
        typeof parsed.data === 'object'
      ) {
        return parsed;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear autosaved data
   */
  function clear() {
    if (!isStorageAvailable()) {
      return;
    }

    try {
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Determine if recovery dialog should be shown
   * @param {Object|null} serverSubmission - Server submission with updatedAt timestamp
   * @returns {boolean}
   */
  function shouldShowRecoveryDialog(serverSubmission) {
    const localData = load();

    if (!localData) {
      return false;
    }

    // If no server submission exists, show recovery dialog
    if (!serverSubmission || !serverSubmission.updatedAt) {
      return true;
    }

    // Compare timestamps - show recovery if local is newer
    const localTime = new Date(localData.timestamp).getTime();
    const serverTime = new Date(serverSubmission.updatedAt).getTime();

    return localTime > serverTime;
  }

  /**
   * Cleanup function - cancel pending saves
   */
  function cleanup() {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      debounceTimeout = null;
    }
  }

  /**
   * Check if a save is currently pending (debounce not finished)
   * @returns {boolean}
   */
  function isPending() {
    return !!debounceTimeout;
  }

  return {
    init,
    save,
    load,
    clear,
    shouldShowRecoveryDialog,
    cleanup,
    _isPending: isPending,
  };
}
