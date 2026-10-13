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
  // online is the logical AND of networkOnline and reachable. The
  // (networkOnline=true, reachable=false) row is the exact WSL2/VPN regression
  // the reachability probe exists to catch: navigator.onLine reports the
  // interface is up while the backend is unreachable, so if the composition
  // ignored `reachable` the offline UX would never engage.
  it.each([
    { net: true, reach: true, expected: true },
    { net: true, reach: false, expected: false },
    { net: false, reach: true, expected: false },
  ])(
    'online === $expected when networkOnline=$net and reachable=$reach',
    async ({ net, reach, expected }) => {
      setNavigatorOnline(net);
      reachable.value = reach;
      await nextTick();
      const { online } = useOnlineStatus();
      expect(online.value).toBe(expected);
    }
  );

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
