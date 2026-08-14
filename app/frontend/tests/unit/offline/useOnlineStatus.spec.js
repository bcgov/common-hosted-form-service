import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import { useOnlineStatus } from '~/offline/useOnlineStatus';
import { reachable } from '~/offline/useReachability';

// Force navigator.onLine changes to propagate through @vueuse/core's useOnline.
// `useOnline` listens for the online/offline events and reads navigator.onLine
// as a fallback; jsdom lets us reassign the property.
function setNavigatorOnline(value) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });
  window.dispatchEvent(new Event(value ? 'online' : 'offline'));
}

describe('offline/useOnlineStatus', () => {
  it('online === true only when both networkOnline and reachable are true', async () => {
    setNavigatorOnline(true);
    reachable.value = true;
    await nextTick();
    const { online } = useOnlineStatus();
    expect(online.value).toBe(true);
  });

  it('online === false when networkOnline is true but reachable is false (WSL2/VPN regression)', async () => {
    // This is the exact case the reachability probe exists to catch:
    // navigator.onLine lies about "the interface is up" while the backend is
    // unreachable. If the composition ignored `reachable`, the offline UX
    // would never engage on WSL2 / VPN-attached machines.
    setNavigatorOnline(true);
    reachable.value = false;
    await nextTick();
    const { online } = useOnlineStatus();
    expect(online.value).toBe(false);
  });

  it('online === false when the network is offline even if reachable is true', async () => {
    setNavigatorOnline(false);
    reachable.value = true;
    await nextTick();
    const { online } = useOnlineStatus();
    expect(online.value).toBe(false);
  });

  it('returns the SAME underlying refs across calls (shared module-scope state, not per-caller)', () => {
    // If each call returned its own refs, one component's reachable flip would
    // silently fail to update another component's `online` computed.
    const a = useOnlineStatus();
    const b = useOnlineStatus();
    expect(a.reachable).toBe(b.reachable);
    expect(a.networkOnline).toBe(b.networkOnline);
    expect(a.online).toBe(b.online);
  });
});
