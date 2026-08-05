import { useOnline } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { SIMULATE_OFFLINE_SS_KEY } from '~/offline/offlineQueueManager';

function readFlag() {
  try {
    return sessionStorage.getItem(SIMULATE_OFFLINE_SS_KEY) === '1';
  } catch {
    return false;
  }
}

function writeFlag(active) {
  try {
    if (active) sessionStorage.setItem(SIMULATE_OFFLINE_SS_KEY, '1');
    if (!active) sessionStorage.removeItem(SIMULATE_OFFLINE_SS_KEY);
  } catch {
    // sessionStorage unavailable; queue manager just won't gate on the flag.
  }
}

// Module-scope singleton: shared across every caller (header control,
// FormViewer, Success page). If each caller created its own ref, toggling
// in one place wouldn't propagate to the others and the submit-gate would
// desync from the header UI.
const simulatingOffline = ref(readFlag());
// Sync flush: write-through so a rehydrate-then-set within the same tick
// isn't coalesced away by the default post-tick flush comparing old===new.
watch(simulatingOffline, writeFlag, { flush: 'sync' });

// URL `?simulateOffline=1` is the gate. `canSimulateOffline` is per-caller
// because it derives from the caller's active route, but `simulatingOffline`
// is app-wide.
export function useSimulationToggle() {
  // Rehydrate on each mount so a session flag set out of band (e.g. Success
  // page navigating in after the queue manager toggled it) is reflected in
  // the shared ref, not stuck at whatever value it held at module-load.
  const stored = readFlag();
  if (simulatingOffline.value !== stored) simulatingOffline.value = stored;

  const route = useRoute();
  const networkOnline = useOnline();
  const canSimulateOffline = computed(
    () => route.query.simulateOffline === '1'
  );
  const online = computed(
    () => networkOnline.value && !simulatingOffline.value
  );
  return { networkOnline, canSimulateOffline, simulatingOffline, online };
}
