import { ref } from 'vue';

// Shared reachability state. `navigator.onLine` only reports whether the OS
// has any interface up (Wi-Fi off with Ethernet still attached, VPN adapters,
// WSL2 vEthernet, etc. all keep it true), so we augment it with a short
// GET against a cheap, unauthenticated, 503-exempt endpoint.

const PROBE_INTERVAL_MS = 20000;
const PROBE_TIMEOUT_MS = 3000;
// After a failed probe, retry sooner so recovery is felt quickly.
const RETRY_INTERVAL_MS = 5000;

// Backend serves /config unauthenticated and it's one of only two paths
// exempt from the statusService 503 gate, so it stays a valid ping target
// even when a downstream sidecar is unhealthy.
function probeUrl() {
  const base = import.meta.env.BASE_URL || '/';
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${trimmed}/config`;
}

export const reachable = ref(true);

let started = false;
let timer = null;
let inFlight = false;

export async function probeReachability() {
  if (inFlight) return reachable.value;
  inFlight = true;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    // cache: no-store keeps the browser from serving a stale 200 from disk
    // cache while the network is actually down.
    const res = await fetch(probeUrl(), {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal,
    });
    reachable.value = res.ok || res.status === 503;
  } catch {
    reachable.value = false;
  } finally {
    clearTimeout(timeoutId);
    inFlight = false;
  }
  return reachable.value;
}

function scheduleNext() {
  if (timer) clearTimeout(timer);
  const delay = reachable.value ? PROBE_INTERVAL_MS : RETRY_INTERVAL_MS;
  timer = setTimeout(async () => {
    await probeReachability();
    scheduleNext();
  }, delay);
}

export function startReachabilityMonitor() {
  if (started) return;
  started = true;

  // Probe once at boot so `reachable` reflects reality, not the default.
  probeReachability().then(scheduleNext);

  if (typeof window !== 'undefined') {
    // Browser thinks the network came back: verify with a probe.
    window.addEventListener('online', () => {
      probeReachability().then(scheduleNext);
    });
    // Browser is certain the network is gone: trust it and stop probing until
    // it flips back (no point burning fetches into the void).
    window.addEventListener('offline', () => {
      reachable.value = false;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    });
    // Tab returning to the foreground: check reachability immediately so the
    // chip doesn't lie for up to 20s after unlock/tab-switch.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      if (navigator.onLine === false) return;
      probeReachability().then(scheduleNext);
    });
  }
}

export function useReachability() {
  return { reachable };
}
