import mitt from 'mitt';
import { ref, watch } from 'vue';

import { i18n } from '~/internationalization';
import formService from '~/services/formService';
import { offlineQueue, QueueStatus } from '~/offline/queue';
import { reachable, startReachabilityMonitor } from '~/offline/useReachability';
import { useAuthStore } from '~/store/auth';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

const POLL_INTERVAL_MS = 30000;

// Suppresses the reauth modal until the user clicks Sign In or the queue
// changes, so the 30s poll does not nag after Not now.
export const REAUTH_SNOOZE_SS_KEY = 'chefs_offline_reauth_snoozed';
// Set before Keycloak redirect; on return we prompt "Send N now?" instead of
// silently draining.
export const REAUTH_PENDING_SS_KEY = 'chefs_offline_pending_reauth_drain';

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

// Exposed so UI can gate a manual Send button while a drain is in flight.
export const isDraining = ref(false);

let started = false;
// Fires once per editing session so the 30s tick doesn't nag repeatedly.
let syncPausedToastShown = false;

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
    isDraft: !!entry.body?.draft,
  });
  return response;
}

export async function tryDrain() {
  if (isDraining.value) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  if (!reachable.value) return;
  if (offlineQueue.entries.value.length === 0) return;
  // Hold off entirely while the user is editing any queued entry; the next
  // tick (or the endEdit-triggered call) picks up once they close the editor.
  if (offlineQueue.isEditing()) {
    if (!syncPausedToastShown) {
      syncPausedToastShown = true;
      useNotificationStore().addNotification({
        text: i18n.t('trans.offlineSubmission.syncPausedForEditToast'),
        ...NotificationTypes.INFO,
      });
    }
    return;
  }
  syncPausedToastShown = false;

  const authStore = useAuthStore();
  if (!authStore.authenticated) {
    if (!isReauthSnoozed()) {
      offlineQueueEvents.emit('auth-required', {
        queuedCount: offlineQueue.entries.value.length,
      });
    }
    return;
  }

  isDraining.value = true;
  try {
    // Snapshot what flush will process so SyncProgressModal rows survive
    // removal. JSON round-trip because entries are Vue reactive Proxies
    // (structuredClone throws DataCloneError, toRaw doesn't recurse).
    const pending = offlineQueue.entries.value.filter(
      (e) =>
        e.status === QueueStatus.PENDING || e.status === QueueStatus.FAILED_AUTH
    );

    const snapshot = JSON.parse(JSON.stringify(pending)); // NOSONAR
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
    isDraining.value = false;
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
