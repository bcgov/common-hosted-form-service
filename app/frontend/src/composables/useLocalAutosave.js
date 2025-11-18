/**
 * Simple local crash-recovery autosave.
 *
 * - Stores form data in localStorage for crash protection only
 * - Does NOT interact with backend drafts or submissions
 * - Must NEVER block or break normal form behavior
 * - 100% silent failure mode (quota, private mode, disabled storage, etc.)
 */

const STORAGE_PREFIX = 'chefs_autosave_';
const DEBOUNCE_DELAY = 3000; // 3 seconds

//Top-level storage-error handler
function handleStorageError(error) {
  String(error);
}

//useLocalAutosave Composable
export function useLocalAutosave() {
  let storageKey = null;
  let debounceTimeout = null;

  /**
   * Initialize autosave for a specific form and optional metadata.
   *
   * @param {string|object} formOrConfig
   *        Either (old API): init(formId)
   *        or (new API): init({ formId, userId, versionId, submissionId })
   *
   * @param {object} [options]
   *        When using old API: second argument holds extra options
   */
  function init(formOrConfig, options = {}) {
    let formId = null;
    let userId = null;
    let versionId = null;
    let submissionId = null;

    // New API: init({ formId, userId, ... })
    if (typeof formOrConfig === 'object' && formOrConfig !== null) {
      formId = formOrConfig.formId;
      userId = formOrConfig.userId;
      versionId = formOrConfig.versionId;
      submissionId = formOrConfig.submissionId;
    } else {
      // Old API: init(formId, { userId, ... })
      formId = formOrConfig;
      userId = options.userId;
      versionId = options.versionId;
      submissionId = options.submissionId;
    }

    if (!formId) {
      throw new Error('formId is required for local autosave');
    }

    const segments = [formId, userId, versionId, submissionId].filter(Boolean);
    storageKey = `${STORAGE_PREFIX}${segments.join(':')}`;
  }

  /**
   * Returns the current localStorage key.
   */
  function getStorageKey() {
    if (!storageKey) {
      throw new Error(
        'useLocalAutosave must be initialized by calling init().'
      );
    }
    return storageKey;
  }

  /**
   * Detect if localStorage is allowed in this environment.
   */
  function isStorageAvailable() {
    if (typeof localStorage === 'undefined') {
      return false;
    }

    try {
      const testKey = `${STORAGE_PREFIX}__test__`;
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      handleStorageError(error);
      return false;
    }
  }

  /**
   * Save data to localStorage (debounced).
   */
  function save(formData) {
    if (!storageKey || !isStorageAvailable()) {
      return;
    }

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    debounceTimeout = setTimeout(() => {
      try {
        const payload = {
          timestamp: new Date().toISOString(),
          data: formData,
        };
        localStorage.setItem(getStorageKey(), JSON.stringify(payload));
      } catch (error) {
        handleStorageError(error);
      }
    }, DEBOUNCE_DELAY);
  }

  /**
   * Load autosaved data.
   */
  function load() {
    if (!storageKey || !isStorageAvailable()) {
      return null;
    }

    try {
      const raw = localStorage.getItem(getStorageKey());
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);

      if (
        parsed &&
        typeof parsed === 'object' &&
        typeof parsed.timestamp === 'string' &&
        parsed.data &&
        typeof parsed.data === 'object'
      ) {
        return parsed;
      }
    } catch (error) {
      handleStorageError(error);
      return null;
    }

    return null;
  }

  /**
   * Remove the autosave entry.
   */
  function clear() {
    if (!storageKey || !isStorageAvailable()) {
      return;
    }

    try {
      localStorage.removeItem(getStorageKey());
    } catch (error) {
      handleStorageError(error);
    }
  }

  /**
   * Detect whether the recovery modal must be shown.
   */
  function shouldShowRecoveryDialog(serverSubmission) {
    const localData = load();

    if (!localData) {
      return false;
    }

    if (!serverSubmission || !serverSubmission.updatedAt) {
      return true;
    }

    const localTime = new Date(localData.timestamp).getTime();
    const serverTime = new Date(serverSubmission.updatedAt).getTime();

    if (Number.isNaN(localTime) || Number.isNaN(serverTime)) {
      return false;
    }

    return localTime > serverTime;
  }

  /**
   * Cancel pending debounced save.
   */
  function cleanup() {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      debounceTimeout = null;
    }
  }

  /**
   * Whether a debounced save is pending.
   */
  function isPending() {
    return !!debounceTimeout;
  }

  function exists() {
    return !!load();
  }

  return {
    init,
    save,
    load,
    clear,
    exists,
    shouldShowRecoveryDialog,
    cleanup,
    _isPending: isPending,
  };
}
