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
    it('sets reachable=true on a 200', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
      const { probeReachability, reachable } = await freshModule();
      await probeReachability();
      expect(reachable.value).toBe(true);
    });

    it('sets reachable=true on a 503 (backend is up; sidecar 503 is a valid liveness ping)', async () => {
      // /config is 503-exempt at the backend, and statusService returns 503
      // whenever ClamAV/NATS is unhealthy. Treating that as "offline" would
      // trip offline mode on every sidecar hiccup, which is the exact bug this
      // 503-is-still-reachable rule is here to prevent.
      fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
      const { probeReachability, reachable } = await freshModule();
      await probeReachability();
      expect(reachable.value).toBe(true);
    });

    it('sets reachable=false on a 500 (and other non-2xx / non-503)', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
      const { probeReachability, reachable } = await freshModule();
      await probeReachability();
      expect(reachable.value).toBe(false);
    });

    it('sets reachable=false when fetch rejects (network error)', async () => {
      fetchMock.mockRejectedValueOnce(new Error('offline'));
      const { probeReachability, reachable } = await freshModule();
      await probeReachability();
      expect(reachable.value).toBe(false);
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
