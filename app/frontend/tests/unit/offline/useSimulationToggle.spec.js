import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

const networkOnlineRef = ref(true);
const routeQuery = { value: {} };

vi.mock('@vueuse/core', () => ({
  useOnline: () => networkOnlineRef,
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ get query() { return routeQuery.value; } }),
}));

import { useSimulationToggle } from '~/offline/useSimulationToggle';
import { SIMULATE_OFFLINE_SS_KEY } from '~/offline/offlineQueueManager';

beforeEach(() => {
  sessionStorage.clear();
  networkOnlineRef.value = true;
  routeQuery.value = {};
});

describe('useSimulationToggle', () => {
  it('canSimulateOffline tracks the ?simulateOffline=1 query gate', () => {
    routeQuery.value = {};
    const a = useSimulationToggle();
    expect(a.canSimulateOffline.value).toBe(false);
    routeQuery.value = { simulateOffline: '1' };
    const b = useSimulationToggle();
    expect(b.canSimulateOffline.value).toBe(true);
  });

  it('rehydrates simulatingOffline from sessionStorage on mount', () => {
    sessionStorage.setItem(SIMULATE_OFFLINE_SS_KEY, '1');
    const { simulatingOffline } = useSimulationToggle();
    expect(simulatingOffline.value).toBe(true);
  });

  it('mirrors simulatingOffline writes back to sessionStorage', async () => {
    const { simulatingOffline } = useSimulationToggle();
    simulatingOffline.value = true;
    await nextTick();
    expect(sessionStorage.getItem(SIMULATE_OFFLINE_SS_KEY)).toBe('1');
    simulatingOffline.value = false;
    await nextTick();
    expect(sessionStorage.getItem(SIMULATE_OFFLINE_SS_KEY)).toBeNull();
  });

  it('online = networkOnline && !simulatingOffline', async () => {
    const { simulatingOffline, online } = useSimulationToggle();
    expect(online.value).toBe(true);
    simulatingOffline.value = true;
    await nextTick();
    expect(online.value).toBe(false);
    simulatingOffline.value = false;
    networkOnlineRef.value = false;
    await nextTick();
    expect(online.value).toBe(false);
  });
});
