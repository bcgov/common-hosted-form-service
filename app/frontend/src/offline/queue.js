import { ref } from 'vue';
import { get, set } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'chefs_offline_queue';
const LOCK_NAME = 'chefs-offline-queue-drain';

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

async function ensureLoaded() {
  if (loaded) return;
  const stored = (await get(STORAGE_KEY)) || [];
  entries.value = Array.isArray(stored) ? stored : [];
  loaded = true;
}

function persist() {
  // JSON round-trip strips Vue reactive Proxies (idb-keyval's structuredClone chokes on them).
  return set(STORAGE_KEY, JSON.parse(JSON.stringify(entries.value)));
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
}) {
  await ensureLoaded();
  if (countForForm(formId) >= QUEUE_SOFT_CAP) {
    const err = new Error('Offline submission cap reached');
    err.code = 'QUEUE_CAP';
    throw err;
  }
  const entry = {
    id: uuidv4(),
    dedupKey: uuidv4(),
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
async function flush(httpPost, onProgress, onEntryFailed) {
  await ensureLoaded();
  const pending = entries.value.filter(
    (e) =>
      e.status === QueueStatus.PENDING || e.status === QueueStatus.FAILED_AUTH
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
        return drain();
      }
    );
  }
  return drain();
}

// Module-global singleton (not a composable); one queue per tab, cross-tab
// coordinated via Web Locks inside flush().
export const offlineQueue = {
  entries,
  ensureLoaded,
  enqueue,
  remove,
  markFailed,
  flush,
};
