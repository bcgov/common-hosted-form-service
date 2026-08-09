// @vitest-environment happy-dom

import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ authenticated: true }));
const queueState = vi.hoisted(() => ({
  entries: { value: [] },
  ensureLoaded: vi.fn(async () => {}),
  flush: vi.fn(async () => ({ total: 0, sent: 0, failed: 0 })),
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

async function freshManager() {
  vi.resetModules();
  sessionStorage.clear();
  authState.authenticated = true;
  queueState.entries.value = [];
  queueState.ensureLoaded.mockClear();
  queueState.flush.mockClear();
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

    it('skips when the simulation flag is on', async () => {
      const mod = await freshManager();
      queueState.entries.value = [{ id: 'a', status: 'pending' }];
      sessionStorage.setItem(mod.SIMULATE_OFFLINE_SS_KEY, '1');

      await mod.tryDrain();
      expect(queueState.flush).not.toHaveBeenCalled();
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
