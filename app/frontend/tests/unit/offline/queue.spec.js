import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

const store = new Map();

vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key) => store.get(key)),
  set: vi.fn(async (key, value) => {
    store.set(key, value);
  }),
}));

async function freshQueue() {
  vi.resetModules();
  store.clear();
  return await import('~/offline/queue');
}

beforeEach(() => {
  // Web Locks isn't in jsdom; flush() falls back to running drain inline.
  delete globalThis.navigator.locks;
});

describe('offline/queue', () => {
  describe('persist', () => {
    it('JSON-clones Vue reactive Proxies before writing to IDB', async () => {
      const { offlineQueue } = await freshQueue();
      const body = reactive({ data: { foo: 'bar' } });
      await expect(
        offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body })
      ).resolves.toBeDefined();
      const stored = store.get('chefs_offline_queue');
      expect(Array.isArray(stored)).toBe(true);
      expect(stored[0].body).toEqual({ data: { foo: 'bar' } });
    });
  });

  describe('enqueue', () => {
    it('assigns a unique dedupKey to each entry', async () => {
      const { offlineQueue } = await freshQueue();
      const a = await offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {} });
      const b = await offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {} });
      expect(a.dedupKey).toBeTruthy();
      expect(b.dedupKey).toBeTruthy();
      expect(a.dedupKey).not.toBe(b.dedupKey);
    });

    it('reuses a caller-supplied dedupKey (from a prior online attempt) instead of minting one', async () => {
      const { offlineQueue } = await freshQueue();
      const dedupKey = 'caller-supplied-key';
      const entry = await offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {}, dedupKey });
      expect(entry.dedupKey).toBe(dedupKey);
    });

    it('throws QUEUE_CAP when the per-form soft cap is reached', async () => {
      const { offlineQueue, QUEUE_SOFT_CAP } = await freshQueue();
      for (let i = 0; i < QUEUE_SOFT_CAP; i++) {
        await offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {} });
      }
      await expect(
        offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {} })
      ).rejects.toMatchObject({ code: 'QUEUE_CAP' });
    });

    it('counts cap per-form (a different formId is unaffected)', async () => {
      const { offlineQueue, QUEUE_SOFT_CAP } = await freshQueue();
      for (let i = 0; i < QUEUE_SOFT_CAP; i++) {
        await offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {} });
      }
      await expect(
        offlineQueue.enqueue({ formId: 'f2', versionId: 'v1', userId: 'u1', body: {} })
      ).resolves.toBeDefined();
    });

    it('clears the reauth-snooze sessionStorage key on enqueue', async () => {
      const { offlineQueue } = await freshQueue();
      sessionStorage.setItem('chefs_offline_reauth_snoozed', '1');
      await offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {} });
      expect(sessionStorage.getItem('chefs_offline_reauth_snoozed')).toBeNull();
    });
  });

  describe('flush', () => {
    it('removes entries on 2xx and calls onProgress with sent count', async () => {
      const { offlineQueue } = await freshQueue();
      await offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {} });
      await offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {} });
      const post = vi.fn().mockResolvedValue({ data: { id: 'x' } });
      const onProgress = vi.fn();
      const result = await offlineQueue.flush(post, onProgress);
      expect(result).toEqual({ total: 2, sent: 2, failed: 0 });
      expect(post).toHaveBeenCalledTimes(2);
      expect(offlineQueue.entries.value).toHaveLength(0);
    });

    it('pauses on 401 without firing onEntryFailed (drain stops, entry kept)', async () => {
      const { offlineQueue, QueueStatus } = await freshQueue();
      await offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {} });
      await offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {} });
      const err = Object.assign(new Error('unauth'), { response: { status: 401 } });
      const post = vi.fn().mockRejectedValue(err);
      const onEntryFailed = vi.fn();
      const result = await offlineQueue.flush(post, undefined, onEntryFailed);
      expect(result.paused).toBe(true);
      expect(post).toHaveBeenCalledTimes(1);
      expect(onEntryFailed).not.toHaveBeenCalled();
      expect(offlineQueue.entries.value[0].status).toBe(QueueStatus.FAILED_AUTH);
    });

    it('fires onEntryFailed on permanent 4xx and continues to the next entry', async () => {
      const { offlineQueue, QueueStatus } = await freshQueue();
      await offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {} });
      await offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {} });
      const err409 = Object.assign(new Error('conflict'), { response: { status: 409 } });
      const post = vi.fn().mockRejectedValueOnce(err409).mockResolvedValueOnce({ data: { id: 'x' } });
      const onEntryFailed = vi.fn();
      const result = await offlineQueue.flush(post, undefined, onEntryFailed);
      expect(result).toEqual({ total: 2, sent: 1, failed: 1 });
      expect(onEntryFailed).toHaveBeenCalledTimes(1);
      expect(onEntryFailed.mock.calls[0][0].status).toBe(QueueStatus.FAILED_IDENTITY_MISMATCH);
    });

    it('pauses without marking failed on a transient (network) error', async () => {
      const { offlineQueue, QueueStatus } = await freshQueue();
      await offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {} });
      const post = vi.fn().mockRejectedValue(new Error('network down'));
      const onEntryFailed = vi.fn();
      const result = await offlineQueue.flush(post, undefined, onEntryFailed);
      expect(result.paused).toBe(true);
      expect(onEntryFailed).not.toHaveBeenCalled();
      expect(offlineQueue.entries.value[0].status).toBe(QueueStatus.PENDING);
    });

    it('skips entries that are open for edit and drains the rest', async () => {
      const { offlineQueue, QueueStatus } = await freshQueue();
      const a = await offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {} });
      const b = await offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {} });
      // 'a' is open for edit (no Web Locks in the test env, so this falls back
      // to the local editing set — the same ids the drain must skip).
      offlineQueue.beginEdit(a.id);

      const posted = [];
      const post = vi.fn(async (entry) => {
        posted.push(entry.id);
        return { data: { id: 'x' } };
      });
      await offlineQueue.flush(post);

      expect(posted).toEqual([b.id]);
      expect(offlineQueue.entries.value.map((e) => e.id)).toEqual([a.id]);
      expect(offlineQueue.entries.value[0].status).toBe(QueueStatus.PENDING);
    });

    it('skips entries locked for edit in ANOTHER tab via navigator.locks.query', async () => {
      const { offlineQueue } = await freshQueue();
      const a = await offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {} });
      const b = await offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {} });
      // Simulate another tab holding the edit lock for `a` (query-only, so flush
      // still drains inline but the cross-tab edit filter excludes `a`).
      globalThis.navigator.locks = {
        query: async () => ({ held: [{ name: `chefs-offline-edit:${a.id}` }] }),
      };
      try {
        const posted = [];
        const post = vi.fn(async (entry) => {
          posted.push(entry.id);
          return { data: { id: 'x' } };
        });
        await offlineQueue.flush(post);
        expect(posted).toEqual([b.id]);
      } finally {
        delete globalThis.navigator.locks;
      }
    });

    it('invokes onStart once with the pending set when a drain begins', async () => {
      const { offlineQueue } = await freshQueue();
      await offlineQueue.enqueue({ formId: 'f1', versionId: 'v1', userId: 'u1', body: {} });
      const onStart = vi.fn();
      await offlineQueue.flush(async () => ({ data: { id: 'x' } }), undefined, undefined, onStart);
      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart.mock.calls[0][0].total).toBe(1);
    });

    it('does not invoke onStart when there is nothing to drain', async () => {
      const { offlineQueue } = await freshQueue();
      const onStart = vi.fn();
      const result = await offlineQueue.flush(async () => {}, undefined, undefined, onStart);
      expect(onStart).not.toHaveBeenCalled();
      expect(result.total).toBe(0);
    });
  });
});
