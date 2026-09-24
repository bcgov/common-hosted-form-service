import { ref } from 'vue';
import { get, set } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'chefs_offline_queue';
const LOCK_NAME = 'chefs-offline-queue-drain';
const CHANNEL_NAME = 'chefs-offline-queue';
const EDIT_LOCK_PREFIX = 'chefs-offline-edit:';

export const QUEUE_SOFT_CAP = 50;

export const QueueStatus = Object.freeze({
  PENDING: 'pending',
  SYNCING: 'syncing',
  FAILED_VALIDATION: 'failed-validation',
  FAILED_AUTH: 'failed-auth',
  FAILED_PERMISSION: 'failed-permission',
  FAILED_IDENTITY_MISMATCH: 'failed-identity-mismatch',
  FAILED_VERSION_GONE: 'failed-version-gone',
});

// Permanent failure HTTP status → queue status. Anything else is transient
// (drain pauses, entry stays PENDING).
const STATUS_TO_FAILED = {
  400: QueueStatus.FAILED_VALIDATION,
  403: QueueStatus.FAILED_PERMISSION,
  404: QueueStatus.FAILED_VERSION_GONE,
  409: QueueStatus.FAILED_IDENTITY_MISMATCH,
  422: QueueStatus.FAILED_VALIDATION,
};

const entries = ref([]);
let loaded = false;
// Firefox Private Browsing and GPO-locked browsers can throw on IDB open, not
// just on later ops; probe once at first ensureLoaded and expose the result so
// callers can degrade the offline UX instead of silently failing.
export const idbAvailable = ref(true);
// Set while THIS tab is draining so we ignore other tabs' change broadcasts
// (we own the authoritative state during our own drain).
let localDraining = false;
let channel = null;
let crossTabInited = false;

// Entry ids open for edit in this tab; tryDrain skips while non-empty.
const editingIds = new Set();
// id -> resolve fn for the held edit Web Lock (see beginEdit).
const editLockReleasers = new Map();

function beginEdit(id) {
  editingIds.add(id);
  // Hold a Web Lock named for this entry so a drain in ANY tab skips it while
  // it is open. The lock auto-releases if this tab closes, so there is no stale
  // edit state to clean up.
  if (typeof navigator === 'undefined' || !navigator.locks?.request) return;
  if (editLockReleasers.has(id)) return;
  navigator.locks
    .request(
      EDIT_LOCK_PREFIX + id,
      () => new Promise((resolve) => editLockReleasers.set(id, resolve))
    )
    .catch(() => {
      // lock request aborted; nothing held to release.
    });
}

function endEdit(id) {
  editingIds.delete(id);
  const release = editLockReleasers.get(id);
  if (release) {
    release();
    editLockReleasers.delete(id);
  }
}

function isEditing() {
  return editingIds.size > 0;
}

// Ids of entries open for edit in ANY tab, via held edit Web Locks. Falls back
// to this tab's set when the Web Locks API is unavailable.
async function lockedEditIds() {
  if (typeof navigator === 'undefined' || !navigator.locks?.query) {
    return new Set(editingIds);
  }
  try {
    const { held } = await navigator.locks.query();
    return new Set(
      (held || [])
        .filter((l) => l.name?.startsWith(EDIT_LOCK_PREFIX))
        .map((l) => l.name.slice(EDIT_LOCK_PREFIX.length))
    );
  } catch {
    return new Set(editingIds);
  }
}

async function ensureLoaded() {
  if (loaded) return;
  try {
    const stored = (await get(STORAGE_KEY)) || [];
    entries.value = Array.isArray(stored) ? stored : [];
    idbAvailable.value = true;
  } catch {
    // IDB unavailable (Firefox Private Browsing, GPO-locked, quota=0);
    // downstream callers gate on idbAvailable and surface a user notice.
    idbAvailable.value = false;
    entries.value = [];
  }
  loaded = true;
  if (!idbAvailable.value) return;
  initCrossTab();
  await recoverStaleSyncing();
}

// Re-read the queue from IDB so this tab reflects changes another tab persisted.
async function reloadFromStore() {
  const stored = (await get(STORAGE_KEY)) || [];
  entries.value = Array.isArray(stored) ? stored : [];
}

// Wire cross-tab sync: reload when another tab persists a change, and on focus.
// Skipped while this tab is draining (it owns the authoritative state then).
function initCrossTab() {
  if (crossTabInited) return;
  crossTabInited = true;
  if (
    typeof window !== 'undefined' &&
    typeof BroadcastChannel !== 'undefined'
  ) {
    try {
      // Can throw in restricted contexts (e.g. Firefox Private Browsing); the
      // visibilitychange reload below still keeps tabs eventually consistent.
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = () => {
        if (!localDraining) reloadFromStore();
      };
    } catch {
      channel = null;
    }
  }
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || localDraining) return;
      reloadFromStore().then(recoverStaleSyncing);
    });
  }
}

// A crash, tab close, or navigation mid-drain leaves entries stuck SYNCING,
// which disables the edit affordance. Reset only when the drain lock is
// available (no other tab is genuinely draining these entries).
async function recoverStaleSyncing() {
  const stale = entries.value.filter((e) => e.status === QueueStatus.SYNCING);
  if (stale.length === 0) return;
  const reset = () => {
    for (const e of stale) e.status = QueueStatus.PENDING;
    return persist();
  };
  if (typeof navigator === 'undefined' || !navigator.locks?.request) {
    await reset();
    return;
  }
  await navigator.locks.request(
    LOCK_NAME,
    { ifAvailable: true },
    async (lock) => {
      if (!lock) return;
      await reset();
    }
  );
}

async function persist() {
  // JSON round-trip strips Vue reactive Proxies (structuredClone throws
  // DataCloneError on nested Proxies; toRaw doesn't recurse).
  await set(STORAGE_KEY, JSON.parse(JSON.stringify(entries.value))); // NOSONAR
  // Nudge other tabs to reload so their chips/lists reflect this change.
  try {
    channel?.postMessage('changed');
  } catch {
    // channel closed; ignore.
  }
}

function countForForm(formId) {
  return entries.value.filter((e) => e.formId === formId).length;
}

async function enqueue({
  formId,
  formName = null,
  versionId,
  userId,
  body,
  note = null,
  showConfirmationId = false,
  // Caller may supply the dedupKey minted for a prior online attempt so a
  // lost-response retry replays instead of duplicating; else mint a fresh one.
  dedupKey = uuidv4(),
}) {
  await ensureLoaded();
  if (!idbAvailable.value) {
    const err = new Error('IndexedDB unavailable');
    err.code = 'IDB_UNAVAILABLE';
    throw err;
  }
  if (countForForm(formId) >= QUEUE_SOFT_CAP) {
    const err = new Error('Offline submission cap reached');
    err.code = 'QUEUE_CAP';
    throw err;
  }
  const entry = {
    id: uuidv4(),
    dedupKey,
    formId,
    formName,
    versionId,
    userId,
    body,
    queuedAt: new Date().toISOString(),
    lastError: null,
    status: QueueStatus.PENDING,
    note,
    showConfirmationId,
  };
  entries.value.push(entry);
  // A fresh queued item is evidence the user wants to send; clear the
  // reauth-snooze so the next tick will re-prompt if the session is dead.
  try {
    sessionStorage.removeItem('chefs_offline_reauth_snoozed');
  } catch {
    // sessionStorage unavailable; nothing to clear.
  }
  await persist();
  return entry;
}

async function update(id, { body, note }) {
  await ensureLoaded();
  const entry = entries.value.find((e) => e.id === id);
  if (!entry) return null;
  if (entry.status === QueueStatus.SYNCING) return null;
  entry.body = body;
  entry.note = note ?? null;
  entry.status = QueueStatus.PENDING;
  entry.lastError = null;
  await persist();
  return entry;
}

async function remove(id) {
  await ensureLoaded();
  entries.value = entries.value.filter((e) => e.id !== id);
  await persist();
}

async function markFailed(id, status, lastError) {
  await ensureLoaded();
  const entry = entries.value.find((e) => e.id === id);
  if (!entry) return;
  entry.status = status;
  entry.lastError = lastError ? String(lastError).slice(0, 500) : null;
  await persist();
}

// httpPost resolves on 2xx (entry removed). On reject: 401 → failed-auth +
// pause; mapped 4xx → failed-* (fires onEntryFailed) + continue; else pause.
async function flush(httpPost, onProgress, onEntryFailed, onStart) {
  await ensureLoaded();
  // Skip entries open for edit in any tab so a drain never sends a stale
  // pre-edit body out from under an editor.
  const editing = await lockedEditIds();
  const pending = entries.value.filter(
    (e) =>
      (e.status === QueueStatus.PENDING ||
        e.status === QueueStatus.FAILED_AUTH) &&
      !editing.has(e.id)
  );
  const total = pending.length;
  let sent = 0;
  let failed = 0;
  if (total === 0) return { total, sent, failed };

  const pause = async (entry, idx, newStatus, err) => {
    if (newStatus) {
      await markFailed(entry.id, newStatus, err);
    } else {
      entry.status = QueueStatus.PENDING;
      await persist();
    }
    onProgress?.({ total, sent, failed, currentIndex: idx, paused: true });
    return { total, sent, failed, paused: true };
  };

  const drain = async () => {
    // Emit only now that we're actually draining (inside the lock, with work to
    // do) so a tab that can't acquire the lock never opens a sync-progress modal.
    onStart?.({ total, entries: pending });
    for (let i = 0; i < pending.length; i++) {
      const entry = pending[i];
      entry.status = QueueStatus.SYNCING;
      await persist();
      onProgress?.({ total, sent, failed, currentIndex: i });
      try {
        await httpPost(entry);
        await remove(entry.id);
        sent += 1;
        continue;
      } catch (err) {
        const status = err?.response?.status || err?.status;
        if (status === 401) {
          return pause(entry, i, QueueStatus.FAILED_AUTH, err);
        }
        const failedStatus = STATUS_TO_FAILED[status];
        if (!failedStatus) {
          return pause(entry, i, null, err);
        }
        await markFailed(entry.id, failedStatus, err);
        onEntryFailed?.({ entry, status: failedStatus, error: err });
        failed += 1;
      }
    }
    onProgress?.({ total, sent, failed, currentIndex: pending.length });
    return { total, sent, failed };
  };

  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request(
      LOCK_NAME,
      { ifAvailable: true },
      async (lock) => {
        if (!lock)
          return { total, sent, failed, paused: true, lockUnavailable: true };
        localDraining = true;
        try {
          return await drain();
        } finally {
          localDraining = false;
        }
      }
    );
  }
  return drain();
}

// Module-global singleton (not a composable); one queue per tab, cross-tab
// coordinated via Web Locks inside flush().
export const offlineQueue = {
  entries,
  idbAvailable,
  ensureLoaded,
  enqueue,
  update,
  remove,
  markFailed,
  flush,
  beginEdit,
  endEdit,
  isEditing,
};
