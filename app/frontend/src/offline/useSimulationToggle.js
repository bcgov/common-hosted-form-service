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

// URL `?simulateOffline=1` is the gate; the toggle ref drives the state and is
// mirrored to sessionStorage so the queue manager skips drain while it's on
// (and the toggle survives "Start another" + refresh).
export function useSimulationToggle() {
  const route = useRoute();
  const networkOnline = useOnline();
  const canSimulateOffline = computed(
    () => route.query.simulateOffline === '1'
  );
  const simulatingOffline = ref(readFlag());
  watch(simulatingOffline, writeFlag);
  const online = computed(
    () => networkOnline.value && !simulatingOffline.value
  );
  return { networkOnline, canSimulateOffline, simulatingOffline, online };
}
