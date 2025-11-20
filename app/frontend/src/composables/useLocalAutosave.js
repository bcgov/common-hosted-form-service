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

// Keep autosave data at most 6 hours
const AUTOSAVE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Best-effort global cleanup every 24 hours per browser
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CLEANUP_META_KEY = 'chefs_last_cleanup';

// Top-level storage-error handler (NEVER throw)
function handleStorageError(error) {
  // Intentionally swallow – autosave is best-effort only
  // Optionally log to console in dev:
  // console.warn('[localAutosave] storage error', error);
  String(error);
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
 * Best-effort global cleanup for ALL CHEFS autosave keys.
 * Runs at most once per CLEANUP_INTERVAL_MS per browser.
 */
function runGlobalCleanupIfDue() {
  if (!isStorageAvailable()) return;

  try {
    const now = Date.now();
    const lastRunRaw = localStorage.getItem(CLEANUP_META_KEY);

    if (lastRunRaw) {
      const lastRun = Number(lastRunRaw);
      if (!Number.isNaN(lastRun) && now - lastRun < CLEANUP_INTERVAL_MS) {
        return; // not time yet
      }
    }

    // Mark as run *before* cleanup to avoid loops on failure
    localStorage.setItem(CLEANUP_META_KEY, String(now));

    // Walk all keys and delete expired/invalid autosave entries
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;

      try {
        const raw = localStorage.getItem(key);
        if (!raw) {
          localStorage.removeItem(key);
          continue;
        }

        const parsed = JSON.parse(raw);
        const ts =
          parsed && parsed.timestamp
            ? new Date(parsed.timestamp).getTime()
            : NaN;

        if (Number.isNaN(ts) || Date.now() - ts > AUTOSAVE_TTL_MS) {
          localStorage.removeItem(key);
        }
      } catch (innerErr) {
        // If anything is weird, delete the offending key
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    handleStorageError(error);
  }
}

// useLocalAutosave Composable
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

    // Best-effort global cleanup across all forms
    runGlobalCleanupIfDue();
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
   * Internal helper: load raw parsed payload (without expiry check).
   */
  function loadRaw() {
    if (!storageKey || !isStorageAvailable()) {
      return null;
    }

    try {
      const raw = localStorage.getItem(getStorageKey());
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }
      return parsed;
    } catch (error) {
      handleStorageError(error);
      return null;
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
      debounceTimeout = null;
    }

    debounceTimeout = setTimeout(() => {
      try {
        const payload = {
          timestamp: new Date().toISOString(),
          data: formData,
          // Reserved fields for future use:
          ttlMs: AUTOSAVE_TTL_MS,
          version: 1,
        };
        localStorage.setItem(getStorageKey(), JSON.stringify(payload));
      } catch (error) {
        handleStorageError(error);
      } finally {
        // Clear reference after execution
        debounceTimeout = null;
      }
    }, DEBOUNCE_DELAY);
  }

  /**
   * Load autosaved data (with expiry check).
   */
  function load() {
    const parsed = loadRaw();
    if (!parsed) return null;

    try {
      const ts = new Date(parsed.timestamp).getTime();
      if (Number.isNaN(ts)) {
        // Invalid timestamp → delete
        localStorage.removeItem(getStorageKey());
        return null;
      }

      const ageMs = Date.now() - ts;
      if (ageMs > AUTOSAVE_TTL_MS) {
        // Expired → delete and ignore
        localStorage.removeItem(getStorageKey());
        return null;
      }

      if (!parsed.data || typeof parsed.data !== 'object') {
        return null;
      }

      return parsed;
    } catch (error) {
      handleStorageError(error);
      return null;
    }
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
   *
   * Only shows when:
   * - valid, non-expired local autosave exists
   * - AND it is newer than the server submission (if any)
   */
  function shouldShowRecoveryDialog(serverSubmission) {
    const localData = load(); // already enforces expiry

    if (!localData) {
      return false;
    }

    // No server timestamp → treat local as newer
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
    // Uses load(), so expired data is also cleaned up
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
