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
const EXPIRY_HOURS = 6; // autosave expiry
const CLEANUP_META_KEY = `${STORAGE_PREFIX}__last_cleanup__`;

// -----------------------------------------------------------------------------
// Top-level storage-error handler (no console, just consume the error)
// -----------------------------------------------------------------------------
function handleStorageError(error) {
  // Intentionally no-op; ensures the parameter is "used" for linters/Sonar.
  String(error);
}

// -----------------------------------------------------------------------------
// Basic storage availability
// -----------------------------------------------------------------------------
function isStorageAvailable() {
  if (typeof localStorage === 'undefined') {
    return false;
  }

  try {
    const testKey = `${STORAGE_PREFIX}__test__`;
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch (error_) {
    handleStorageError(error_);
    return false;
  }
}

// -----------------------------------------------------------------------------
// Helpers for cleanup / expiry
// -----------------------------------------------------------------------------
function getNowMs() {
  return Date.now();
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch (error_) {
    // Treat JSON parse failures as handled; we just ignore that entry
    handleStorageError(error_);
    return null;
  }
}

function ageHours(timestampMs, nowMs) {
  if (typeof timestampMs !== 'number') {
    return Number.NaN;
  }

  const delta = nowMs - timestampMs;
  if (delta < 0) {
    return Number.NaN;
  }

  // ms → hours
  return delta / (1000 * 60 * 60);
}

function isExpired(timestampIso, nowMs) {
  if (typeof timestampIso !== 'string') {
    return false;
  }
  const ts = Date.parse(timestampIso);
  if (Number.isNaN(ts)) {
    return false;
  }
  const hours = ageHours(ts, nowMs);
  if (Number.isNaN(hours)) {
    return false;
  }
  return hours > EXPIRY_HOURS;
}

function cleanupKeyIfExpired(key, nowMs) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return;
  }

  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== 'object') {
    // Corrupt/unexpected payload → remove
    localStorage.removeItem(key);
    return;
  }

  const timestampIso = parsed.timestamp;
  if (isExpired(timestampIso, nowMs)) {
    localStorage.removeItem(key);
  }
}

function getLastCleanupTime() {
  try {
    const raw = localStorage.getItem(CLEANUP_META_KEY);
    if (!raw) {
      return null;
    }
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      return null;
    }
    return parsed;
  } catch (error_) {
    handleStorageError(error_);
    return null;
  }
}

function setLastCleanupTime(nowMs) {
  try {
    localStorage.setItem(CLEANUP_META_KEY, String(nowMs));
  } catch (error_) {
    // Best-effort only
    handleStorageError(error_);
  }
}

function shouldRunGlobalCleanup(nowMs) {
  const last = getLastCleanupTime();
  if (last === null) {
    return true;
  }
  const hours = ageHours(last, nowMs);
  if (Number.isNaN(hours)) {
    return true;
  }
  // Run at most once per hour
  return hours >= 1;
}

function collectAutosaveKeys() {
  const keys = [];
  const len = localStorage.length;

  for (let i = 0; i < len; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (!key.startsWith(STORAGE_PREFIX)) continue;
    if (key === CLEANUP_META_KEY) continue;
    keys.push(key);
  }

  return keys;
}

// Global expiry/cleanup, runs occasionally; best-effort only.
function runGlobalCleanupIfDue() {
  if (!isStorageAvailable()) {
    return;
  }

  const now = getNowMs();
  if (!shouldRunGlobalCleanup(now)) {
    return;
  }

  try {
    const keys = collectAutosaveKeys();

    for (const key of keys) {
      try {
        cleanupKeyIfExpired(key, now);
      } catch (error_) {
        // If anything goes wrong for a specific key, remove it to avoid
        // repeated failures in the future.
        handleStorageError(error_);
        try {
          localStorage.removeItem(key);
        } catch (error__) {
          // Still best-effort; we already tried.
          handleStorageError(error__);
        }
      }
    }

    setLastCleanupTime(now);
  } catch (error_) {
    // Global cleanup is best-effort; ignore failures beyond recording them
    handleStorageError(error_);
  }
}

// -----------------------------------------------------------------------------
// useLocalAutosave composable
// -----------------------------------------------------------------------------
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

    // Run global cleanup occasionally whenever autosave is initialised
    if (isStorageAvailable()) {
      runGlobalCleanupIfDue();
    }

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
   * Save data to localStorage (debounced).
   */
  function save(formData) {
    if (!storageKey || !isStorageAvailable()) {
      return;
    }

    // Best-effort expiry maintenance
    runGlobalCleanupIfDue();

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      debounceTimeout = null;
    }

    debounceTimeout = setTimeout(() => {
      try {
        const payload = {
          timestamp: new Date().toISOString(),
          data: formData,
        };
        localStorage.setItem(getStorageKey(), JSON.stringify(payload));
      } catch (error_) {
        handleStorageError(error_);
      } finally {
        debounceTimeout = null;
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

      const parsed = safeParse(raw);
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        typeof parsed.timestamp !== 'string' ||
        !parsed.data ||
        typeof parsed.data !== 'object'
      ) {
        return null;
      }

      return {
        timestamp: parsed.timestamp,
        data: parsed.data,
      };
    } catch (error_) {
      handleStorageError(error_);
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
    } catch (error_) {
      handleStorageError(error_);
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

    // If server submission has never been saved (no updatedAt), always show
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
   * (exposed only for tests / beforeunload logic)
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
