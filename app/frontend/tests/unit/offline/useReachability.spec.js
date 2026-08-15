import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The module is stateful (started/timer flags at module scope), so each test
// re-imports it after resetModules to get a clean slate.
async function freshModule() {
  vi.resetModules();
  return await import('~/offline/useReachability');
}

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('offline/useReachability', () => {
  describe('probeReachability', () => {
    // 503 maps to reachable=true on purpose: /config is 503-exempt at the
    // backend, and statusService returns 503 whenever ClamAV/NATS is unhealthy.
    // Treating that as "offline" would trip offline mode on every sidecar
    // hiccup, which is the exact bug the 503-is-still-reachable rule prevents.
    it.each([
      { desc: 'a 200', response: { ok: true, status: 200 }, expected: true },
      { desc: 'a 503 (backend up; sidecar 503 is a valid liveness ping)', response: { ok: false, status: 503 }, expected: true },
      { desc: 'a 500 (and other non-2xx / non-503)', response: { ok: false, status: 500 }, expected: false },
      { desc: 'a network error (fetch rejects)', reject: true, expected: false },
    ])('sets reachable=$expected on $desc', async ({ response, reject, expected }) => {
      if (reject) {
        fetchMock.mockRejectedValueOnce(new Error('offline'));
      } else {
        fetchMock.mockResolvedValueOnce(response);
      }
      const { probeReachability, reachable } = await freshModule();
      await probeReachability();
      expect(reachable.value).toBe(expected);
    });

    it('attaches an AbortController signal to the fetch call', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
      const { probeReachability } = await freshModule();
      await probeReachability();
      const opts = fetchMock.mock.calls[0][1];
      expect(opts.signal).toBeDefined();
      expect(typeof opts.signal.aborted).toBe('boolean');
    });

    it('aborts and marks reachable=false when the 3s timeout fires', async () => {
      vi.useFakeTimers();
      // Never-resolving fetch that observes the abort signal.
      fetchMock.mockImplementationOnce((_url, opts) => {
        return new Promise((_resolve, reject) => {
          opts.signal.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      });
      const { probeReachability, reachable } = await freshModule();
      const done = probeReachability();
      // Advance past the 3s timeout to trigger the abort.
      await vi.advanceTimersByTimeAsync(3100);
      await done;
      expect(reachable.value).toBe(false);
    });
  });

  describe('startReachabilityMonitor', () => {
    it('flips reachable to false immediately on window.offline without waiting for a probe', async () => {
      fetchMock.mockResolvedValue({ ok: true, status: 200 });
      const { startReachabilityMonitor, reachable } = await freshModule();
      startReachabilityMonitor();
      // Let the boot probe resolve so reachable is true first.
      await vi.waitFor(() => expect(reachable.value).toBe(true));

      window.dispatchEvent(new Event('offline'));

      // No await for a network round-trip: the offline event is synchronous.
      expect(reachable.value).toBe(false);
    });

    it('issues an immediate probe on visibilitychange back to visible', async () => {
      fetchMock.mockResolvedValue({ ok: true, status: 200 });
      const { startReachabilityMonitor } = await freshModule();
      startReachabilityMonitor();
      // Wait for the boot probe. Snapshot count instead of asserting an exact
      // number: stale document listeners registered by prior tests in this
      // file (jsdom shares document across tests, and addEventListener is
      // idempotent-per-registration, not per-module) can add extra calls.
      await vi.waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(1));
      const beforeVisibility = fetchMock.mock.calls.length;

      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));

      await vi.waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(beforeVisibility));
    });
  });
});
