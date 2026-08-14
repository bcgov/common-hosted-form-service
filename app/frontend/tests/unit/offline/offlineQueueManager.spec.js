// @vitest-environment happy-dom

import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ authenticated: true }));
const queueState = vi.hoisted(() => ({
  entries: { value: [] },
  ensureLoaded: vi.fn(async () => {}),
  flush: vi.fn(async () => ({ total: 0, sent: 0, failed: 0 })),
  isEditing: vi.fn(() => false),
}));

vi.mock('~/store/auth', () => ({
  useAuthStore: () => authState,
}));

vi.mock('~/services/formService', () => ({
  default: { createSubmission: vi.fn() },
}));

vi.mock('~/offline/queue', () => ({
  offlineQueue: queueState,
  QueueStatus: {
    PENDING: 'pending',
    SYNCING: 'syncing',
    FAILED_AUTH: 'failed-auth',
  },
}));

// Reachability probe would hit the network in happy-dom; stub it so the
// module-level ref is present and startReachabilityMonitor is a no-op. Use a
// real Vue ref so watch(reachable) in the manager fires on change.
const reachabilityState = vi.hoisted(async () => {
  const { ref } = await import('vue');
  return { reachable: ref(true) };
});
vi.mock('~/offline/useReachability', async () => {
  const state = await reachabilityState;
  return {
    reachable: state.reachable,
    startReachabilityMonitor: vi.fn(),
    probeReachability: vi.fn(async () => true),
    useReachability: () => ({ reachable: state.reachable }),
  };
});

async function freshManager() {
  vi.resetModules();
  sessionStorage.clear();
  authState.authenticated = true;
  queueState.entries.value = [];
  queueState.ensureLoaded.mockClear();
  queueState.flush.mockClear();
  const state = await reachabilityState;
  state.reachable.value = true;
  return await import('~/offline/offlineQueueManager');
}

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('offlineQueueManager', () => {
  describe('tryDrain pre-flight auth check', () => {
    it('emits auth-required and skips flush when not authenticated', async () => {
      const mod = await freshManager();
      authState.authenticated = false;
      queueState.entries.value = [{ id: 'a' }, { id: 'b' }];

      const spy = vi.fn();
      mod.offlineQueueEvents.on('auth-required', spy);
      await mod.tryDrain();

      expect(spy).toHaveBeenCalledWith({ queuedCount: 2 });
      expect(queueState.flush).not.toHaveBeenCalled();
    });

    it('does not emit auth-required when the snooze flag is set', async () => {
      const mod = await freshManager();
      authState.authenticated = false;
      queueState.entries.value = [{ id: 'a' }];
      sessionStorage.setItem(mod.REAUTH_SNOOZE_SS_KEY, '1');

      const spy = vi.fn();
      mod.offlineQueueEvents.on('auth-required', spy);
      await mod.tryDrain();

      expect(spy).not.toHaveBeenCalled();
    });

    it('runs flush when authenticated', async () => {
      const mod = await freshManager();
      queueState.entries.value = [{ id: 'a', status: 'pending' }];

      await mod.tryDrain();
      expect(queueState.flush).toHaveBeenCalledTimes(1);
    });

  });

  describe('clearReauthSnooze', () => {
    it('removes the snooze key', async () => {
      const mod = await freshManager();
      sessionStorage.setItem(mod.REAUTH_SNOOZE_SS_KEY, '1');
      mod.clearReauthSnooze();
      expect(sessionStorage.getItem(mod.REAUTH_SNOOZE_SS_KEY)).toBeNull();
    });
  });

  describe('reachability gating', () => {
    it('skips flush when reachable is false, even with pending entries', async () => {
      const mod = await freshManager();
      queueState.entries.value = [{ id: 'a', status: 'pending' }];
      (await reachabilityState).reachable.value = false;

      await mod.tryDrain();

      // The heartbeat says the backend is unreachable; a POST would just fail
      // and burn an entry through its retry budget. Gate must fire early.
      expect(queueState.flush).not.toHaveBeenCalled();
    });

    it('kicks an immediate drain when reachable flips false → true (does not wait for the 30s tick)', async () => {
      const mod = await freshManager();
      queueState.entries.value = [{ id: 'a', status: 'pending' }];
      (await reachabilityState).reachable.value = false;

      mod.startOfflineQueueManager();
      // startOfflineQueueManager fires an initial tick(): assert baseline count
      // AFTER that runs so the flip is what we're measuring.
      await queueState.ensureLoaded.mock.results[0].value;
      const baselineFlushCalls = queueState.flush.mock.calls.length;

      (await reachabilityState).reachable.value = true;
      // Vue's watch is microtask-scheduled; let it flush.
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));

      expect(queueState.flush.mock.calls.length).toBeGreaterThan(baselineFlushCalls);
    });
  });

  describe('entry-failed relay', () => {
    it('emits entry-failed with the dedupKey, status, and error detail when flush reports a permanent 4xx', async () => {
      const mod = await freshManager();
      queueState.entries.value = [{ id: 'a', dedupKey: 'dk-1', status: 'pending' }];
      // Invoke the onEntryFailed callback the manager passes into flush, so
      // that the relay path is exercised end-to-end (without needing to fake
      // an httpPost inside the real queue).
      queueState.flush.mockImplementationOnce(async (_httpPost, _onProgress, onEntryFailed) => {
        onEntryFailed({
          entry: { dedupKey: 'dk-1' },
          status: 'failed-identity-mismatch',
          error: { response: { data: { detail: 'This Dedup-Key belongs to a different user.' } } },
        });
        return { total: 1, sent: 0, failed: 1 };
      });

      const spy = vi.fn();
      mod.offlineQueueEvents.on('entry-failed', spy);
      await mod.tryDrain();

      expect(spy).toHaveBeenCalledWith({
        dedupKey: 'dk-1',
        status: 'failed-identity-mismatch',
        error: 'This Dedup-Key belongs to a different user.',
      });
    });
  });

  describe('startOfflineQueueManager post-login follow-up', () => {
    it('emits reauth-drain-confirm when pending flag is set and queue has items', async () => {
      const mod = await freshManager();
      queueState.entries.value = [{ id: 'a' }];
      sessionStorage.setItem(mod.REAUTH_PENDING_SS_KEY, '1');

      const spy = vi.fn();
      mod.offlineQueueEvents.on('reauth-drain-confirm', spy);
      mod.startOfflineQueueManager();
      await queueState.ensureLoaded.mock.results[0].value;

      expect(spy).toHaveBeenCalledWith({ queuedCount: 1 });
      expect(sessionStorage.getItem(mod.REAUTH_PENDING_SS_KEY)).toBeNull();
    });

    it('does not emit reauth-drain-confirm when queue is empty', async () => {
      const mod = await freshManager();
      queueState.entries.value = [];
      sessionStorage.setItem(mod.REAUTH_PENDING_SS_KEY, '1');

      const spy = vi.fn();
      mod.offlineQueueEvents.on('reauth-drain-confirm', spy);
      mod.startOfflineQueueManager();
      await queueState.ensureLoaded.mock.results[0].value;

      expect(spy).not.toHaveBeenCalled();
      expect(sessionStorage.getItem(mod.REAUTH_PENDING_SS_KEY)).toBeNull();
    });
  });
});
