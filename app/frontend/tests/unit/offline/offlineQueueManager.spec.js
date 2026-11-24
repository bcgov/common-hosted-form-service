// @vitest-environment happy-dom

import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import formService from '~/services/formService';

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

// tryDrain now gates on isPrimary; pin this "tab" as primary so the drain path
// runs in tests. Use a real Vue ref so any watch(isPrimary) fires on change.
const primaryState = vi.hoisted(async () => {
  const { ref } = await import('vue');
  return { isPrimary: ref(true) };
});
vi.mock('~/offline/tabPrimary', async () => {
  const state = await primaryState;
  return {
    isPrimary: state.isPrimary,
    startPrimaryElection: vi.fn(),
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
  (await primaryState).isPrimary.value = true;
  return await import('~/offline/offlineQueueManager');
}

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('offlineQueueManager', () => {
  it.each([true, false])('resumes a challenged send only when verified (%s)', async (verified) => {
    const mod = await freshManager();
    const entry = {
      id: 'a',
      formId: 'f1',
      versionId: 'v1',
      body: { draft: false },
      queuedAt: '2026-11-20T18:00:00Z',
      dedupKey: 'original-key',
    };
    const challenge = {
      response: { status: 403, data: { code: 'TURNSTILE_REQUIRED' } },
    };
    queueState.entries.value = [entry];
    formService.createSubmission.mockReset();
    formService.createSubmission
      .mockRejectedValueOnce(challenge)
      .mockResolvedValueOnce({ data: { id: 'submitted' } });
    queueState.flush.mockImplementationOnce(async (post) => {
      const sending = post(entry);
      await Promise.resolve();
      expect(mod.pendingVerification.value.formId).toBe(entry.formId);
      mod.pendingVerification.value.resolve(
        verified ? mod.VerificationOutcome.VERIFIED : mod.VerificationOutcome.CANCELLED
      );
      if (verified) {
        await expect(sending).resolves.toMatchObject({ data: { id: 'submitted' } });
      } else {
        await expect(sending).rejects.toBe(challenge);
      }
      return { total: 1, sent: Number(verified), failed: 0 };
    });

    await mod.tryDrain();

    expect(mod.pendingVerification.value).toBeNull();
    expect(formService.createSubmission).toHaveBeenCalledTimes(verified ? 2 : 1);
    if (verified) {
      expect(formService.createSubmission.mock.calls[1]).toEqual(
        formService.createSubmission.mock.calls[0]
      );
    }
  });

  describe('cancelled Turnstile verification', () => {
    const entryA = { id: 'a', formId: 'f1', versionId: 'v1', body: { draft: false }, dedupKey: 'key-a' };
    const entryB = { id: 'b', formId: 'f2', versionId: 'v2', body: { draft: false }, dedupKey: 'key-b' };
    const challenge = { response: { status: 403, data: { code: 'TURNSTILE_REQUIRED' } } };

    // One drain that challenges entryA and ends the prompt with `outcome`.
    function challengeOnce(mod, outcome) {
      formService.createSubmission.mockReset();
      formService.createSubmission.mockRejectedValueOnce(challenge);
      queueState.flush.mockImplementationOnce(async (post) => {
        const sending = post(entryA);
        await Promise.resolve();
        mod.pendingVerification.value.resolve(mod.VerificationOutcome[outcome]);
        await expect(sending).rejects.toBe(challenge);
        return { total: 2, sent: 0, failed: 0 };
      });
    }
    const isDeferredFor = (call) => queueState.flush.mock.calls[call][4];

    it('holds back only the cancelled form on automatic drains', async () => {
      const mod = await freshManager();
      queueState.entries.value = [entryA, entryB];
      challengeOnce(mod, 'CANCELLED');

      await mod.tryDrain();
      // flush reads this live, so the rest of that drain skips the form too.
      expect(isDeferredFor(0)(entryA)).toBe(true);

      await mod.tryDrain({ automatic: true });
      expect(queueState.flush).toHaveBeenCalledTimes(2);
      expect(isDeferredFor(1)(entryA)).toBe(true);
      expect(isDeferredFor(1)(entryB)).toBe(false);
    });

    it('asks again for a cancelled form on a drain the user starts', async () => {
      const mod = await freshManager();
      queueState.entries.value = [entryA, entryB];
      challengeOnce(mod, 'CANCELLED');

      await mod.tryDrain();
      await mod.tryDrain();

      expect(isDeferredFor(1)(entryA)).toBe(false);
    });

    it('does not hold the form back when the prompt is interrupted', async () => {
      const mod = await freshManager();
      queueState.entries.value = [entryA, entryB];
      challengeOnce(mod, 'INTERRUPTED');

      await mod.tryDrain();
      await mod.tryDrain({ automatic: true });

      expect(isDeferredFor(1)(entryA)).toBe(false);
    });

    it('treats losing the primary tab as an interruption, not a cancel', async () => {
      const mod = await freshManager();
      const primary = (await primaryState).isPrimary;
      queueState.entries.value = [entryA];
      formService.createSubmission.mockReset();
      formService.createSubmission.mockRejectedValueOnce(challenge);
      queueState.flush.mockImplementationOnce(async (post) => {
        await expect(post(entryA)).rejects.toBe(challenge);
        return { total: 1, sent: 0, failed: 0 };
      });

      // The initial tick drains and opens the prompt.
      mod.startOfflineQueueManager();
      await vi.waitFor(() => expect(mod.pendingVerification.value?.formId).toBe('f1'));

      primary.value = false;
      await vi.waitFor(() => expect(mod.pendingVerification.value).toBeNull());
      await vi.waitFor(() => expect(mod.isDraining.value).toBe(false));

      primary.value = true;
      await vi.waitFor(() => expect(queueState.flush).toHaveBeenCalledTimes(2));
      expect(isDeferredFor(1)(entryA)).toBe(false);
    });
  });

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

  // SyncProgressModal opens only on drain-start (fired by flush inside the lock
  // when there is work). tryDrain must not emit anything ahead of flush that
  // could open it for a drain that never happens.
  describe('sync modal events', () => {
    it('emits nothing when another tab holds the drain lock', async () => {
      const mod = await freshManager();
      queueState.entries.value = [{ id: 'a', dedupKey: 'dk-1', status: 'pending' }];
      queueState.flush.mockImplementationOnce(async () => ({
        total: 1,
        sent: 0,
        failed: 0,
        paused: true,
        lockUnavailable: true,
      }));

      const events = [];
      mod.offlineQueueEvents.on('*', (type) => events.push(type));
      await mod.tryDrain();

      expect(queueState.flush).toHaveBeenCalledTimes(1);
      expect(events).toEqual([]);
    });

    it('does not emit drain-start when only non-sendable entries are queued', async () => {
      const mod = await freshManager();
      queueState.entries.value = [{ id: 'a', dedupKey: 'dk-1', status: 'failed-validation' }];
      // Real flush filters these out and returns before onStart.
      queueState.flush.mockImplementationOnce(async () => ({ total: 0, sent: 0, failed: 0 }));

      const events = [];
      mod.offlineQueueEvents.on('*', (type) => events.push(type));
      await mod.tryDrain();

      expect(events).not.toContain('drain-start');
      expect(events).toEqual(['drain-end']);
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
