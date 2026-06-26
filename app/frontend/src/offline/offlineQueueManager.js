import mitt from 'mitt';

import formService from '~/services/formService';
import { offlineQueue, QueueStatus } from '~/offline/queue';

const POLL_INTERVAL_MS = 30000;

// Set while the simulating-offline toggle is on; tryDrain skips while set.
export const SIMULATE_OFFLINE_SS_KEY = 'chefs_simulate_offline';

function isSimulationActive() {
  try {
    return (
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(SIMULATE_OFFLINE_SS_KEY) === '1'
    );
  } catch {
    return false;
  }
}

export const offlineQueueEvents = mitt();

let started = false;
let draining = false;

async function postEntry(entry) {
  const response = await formService.createSubmission(
    entry.formId,
    entry.versionId,
    { ...entry.body, queuedAt: entry.queuedAt },
    { dedupKey: entry.dedupKey }
  );
  // Surface the real id so synthetic Success pages can swap their URL.
  offlineQueueEvents.emit('synced', {
    dedupKey: entry.dedupKey,
    submissionId: response?.data?.id,
  });
  return response;
}

async function tryDrain() {
  if (draining) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  if (isSimulationActive()) return;
  if (offlineQueue.entries.value.length === 0) return;

  draining = true;
  try {
    // Snapshot what flush will process so SyncProgressModal rows survive removal.
    const snapshot = JSON.parse(
      JSON.stringify(
        offlineQueue.entries.value.filter(
          (e) =>
            e.status === QueueStatus.PENDING ||
            e.status === QueueStatus.FAILED_AUTH
        )
      )
    );
    offlineQueueEvents.emit('drain-start', {
      total: snapshot.length,
      entries: snapshot,
    });
    const result = await offlineQueue.flush(
      postEntry,
      (progress) => {
        offlineQueueEvents.emit('drain-progress', progress);
      },
      ({ entry, status, error }) => {
        offlineQueueEvents.emit('entry-failed', {
          dedupKey: entry.dedupKey,
          status,
          error:
            error?.response?.data?.detail || error?.message || String(error),
        });
      }
    );
    offlineQueueEvents.emit('drain-end', result);
  } finally {
    draining = false;
  }
}

function tick() {
  tryDrain();
  setTimeout(tick, POLL_INTERVAL_MS);
}

// Idempotent. Listens for window 'online', polls every 30s (navigator.onLine
// is unreliable), and flush() uses Web Locks to coordinate across tabs.
export function startOfflineQueueManager() {
  if (started) return;
  started = true;

  // Prime entries from IDB so chips are accurate before the first enqueue.
  offlineQueue.ensureLoaded();
  if (typeof window !== 'undefined') {
    window.addEventListener('online', tryDrain);
  }
  tick();
}
