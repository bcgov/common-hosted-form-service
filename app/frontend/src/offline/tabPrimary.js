import { ref } from 'vue';

// Primary-tab election for offline UX. The primary tab is the only tab that
// runs the drain loop, so it is also the only one that opens SyncProgressModal,
// ReauthRequiredModal, and the drain toasts. Non-primary tabs still show the
// pending chip and honor user-initiated actions (open pending list, edit).
//
// Election rule: last focus wins. On focus / visibilitychange-to-visible /
// pagehide of the current primary, tabs broadcast a claim; higher ts wins,
// with higher tabId as tiebreak.

const CHANNEL_NAME = 'chefs-offline-primary';
const CLAIM = 'primary-claim';
const RELEASE = 'primary-release';

function generateTabId() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`; // NOSONAR - tab id, not a secret
}

const tabId = generateTabId();

export const isPrimary = ref(false);

let currentPrimaryId = null;
let currentPrimaryTs = 0;
let channel = null;
let started = false;

function applyClaim(claimTabId, claimTs) {
  if (
    claimTs > currentPrimaryTs ||
    (claimTs === currentPrimaryTs && claimTabId > currentPrimaryId)
  ) {
    currentPrimaryId = claimTabId;
    currentPrimaryTs = claimTs;
    isPrimary.value = claimTabId === tabId;
  }
}

function claim() {
  const ts = Date.now();
  applyClaim(tabId, ts);
  try {
    channel?.postMessage({ type: CLAIM, tabId, ts });
  } catch {
    // channel closed; ignore
  }
}

function release() {
  if (currentPrimaryId !== tabId) return;
  try {
    channel?.postMessage({ type: RELEASE, tabId });
  } catch {
    // ignore
  }
  currentPrimaryId = null;
  currentPrimaryTs = 0;
  isPrimary.value = false;
}

function shouldClaim() {
  if (typeof document === 'undefined') return true;
  return document.visibilityState === 'visible' || document.hasFocus();
}

export function startPrimaryElection() {
  if (started) return;
  started = true;
  if (typeof window === 'undefined') return;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.addEventListener('message', (event) => {
        const msg = event.data;
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === CLAIM) {
          applyClaim(msg.tabId, msg.ts);
          return;
        }
        if (msg.type === RELEASE && msg.tabId === currentPrimaryId) {
          currentPrimaryId = null;
          currentPrimaryTs = 0;
          isPrimary.value = false;
          if (shouldClaim()) {
            // Small jitter so surviving tabs don't all claim in lockstep.
            setTimeout(() => {
              if (shouldClaim()) claim();
            }, Math.floor(Math.random() * 100)); // NOSONAR - jitter delay, not a secret
          }
        }
      });
    } catch {
      channel = null;
    }
  }
  window.addEventListener('focus', () => {
    if (shouldClaim()) claim();
  });
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (shouldClaim()) claim();
    });
  }
  window.addEventListener('pagehide', release);
  // Initial claim if this tab is already visible / focused at load time
  // (covers single-tab open and refresh cases).
  if (shouldClaim()) claim();
}
