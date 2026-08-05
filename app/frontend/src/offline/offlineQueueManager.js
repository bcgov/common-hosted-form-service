import mitt from 'mitt';
import { watch } from 'vue';

import formService from '~/services/formService';
import { offlineQueue, QueueStatus } from '~/offline/queue';
import { reachable, startReachabilityMonitor } from '~/offline/useReachability';
import { useAuthStore } from '~/store/auth';

const POLL_INTERVAL_MS = 30000;

// Set while the simulating-offline toggle is on; tryDrain skips while set.
export const SIMULATE_OFFLINE_SS_KEY = 'chefs_simulate_offline';
// Suppresses the reauth modal until the user clicks Sign In or the queue
// changes, so the 30s poll does not nag after Not now.
export const REAUTH_SNOOZE_SS_KEY = 'chefs_offline_reauth_snoozed';
// Set before Keycloak redirect; on return we prompt "Send N now?" instead of
// silently draining.
export const REAUTH_PENDING_SS_KEY = 'chefs_offline_pending_reauth_drain';

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

function isReauthSnoozed() {
  try {
    return (
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(REAUTH_SNOOZE_SS_KEY) === '1'
    );
  } catch {
    return false;
  }
}

export function clearReauthSnooze() {
  try {
    sessionStorage.removeItem(REAUTH_SNOOZE_SS_KEY);
  } catch {
    // sessionStorage unavailable; nothing to clear.
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

export async function tryDrain() {
  if (draining) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  if (!reachable.value) return;
  if (isSimulationActive()) return;
  if (offlineQueue.entries.value.length === 0) return;

  const authStore = useAuthStore();
  if (!authStore.authenticated) {
    if (!isReauthSnoozed()) {
      offlineQueueEvents.emit('auth-required', {
        queuedCount: offlineQueue.entries.value.length,
      });
    }
    return;
  }

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

function checkReauthFollowup() {
  try {
    if (sessionStorage.getItem(REAUTH_PENDING_SS_KEY) !== '1') return;
  } catch {
    return;
  }
  const authStore = useAuthStore();
  if (!authStore.authenticated) return;
  if (offlineQueue.entries.value.length === 0) {
    try {
      sessionStorage.removeItem(REAUTH_PENDING_SS_KEY);
    } catch {
      // ignore
    }
    return;
  }
  try {
    sessionStorage.removeItem(REAUTH_PENDING_SS_KEY);
  } catch {
    // ignore
  }
  offlineQueueEvents.emit('reauth-drain-confirm', {
    queuedCount: offlineQueue.entries.value.length,
  });
}

// Idempotent. Listens for window 'online', polls every 30s (navigator.onLine
// is unreliable), and flush() uses Web Locks to coordinate across tabs.
export function startOfflineQueueManager() {
  if (started) return;
  started = true;

  // Reachability probe is our source of truth for "can I reach the API";
  // start it before the drain loop so tryDrain gates on real state.
  startReachabilityMonitor();

  // Prime entries from IDB so chips are accurate before the first enqueue.
  offlineQueue.ensureLoaded().then(() => {
    checkReauthFollowup();
  });
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      clearReauthSnooze();
      tryDrain();
    });
  }
  // Drain immediately when the heartbeat flips back to reachable, without
  // waiting for the next 30s tick.
  watch(reachable, (isReachable) => {
    if (!isReachable) return;
    clearReauthSnooze();
    tryDrain();
  });
  tick();
}
