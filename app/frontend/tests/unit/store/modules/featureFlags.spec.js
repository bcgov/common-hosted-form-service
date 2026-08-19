import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFeatureFlagStore } from '~/store/featureFlags';
import featureFlagService from '~/services/featureFlagService';

vi.mock('~/services/featureFlagService', () => ({
  default: { check: vi.fn() },
}));

describe('featureFlags store', () => {
  setActivePinia(createPinia());
  const store = useFeatureFlagStore();

  beforeEach(() => {
    store.$reset();
    featureFlagService.check.mockReset();
  });

  describe('resolveForContext', () => {
    it('clears the active map synchronously before the resolution completes so a stale flag cannot leak', async () => {
      // A stale active map carried over from a previously-opened allowlisted form.
      store.active = { offlineForms: true, submitToEmail: true };
      // A new-form (empty context) resolution that has not responded yet.
      let respond;
      featureFlagService.check.mockReturnValueOnce(
        new Promise((resolve) => {
          respond = resolve;
        })
      );

      const pending = store.resolveForContext({});

      // Cleared immediately — before the backend responds — so gated, allowlist-
      // only controls do not briefly show on the new form.
      expect(store.active).toEqual({});
      expect(store.isActive('offlineForms')).toBe(false);

      respond({ data: { offlineForms: false, submitToEmail: false } });
      await pending;

      expect(store.active).toEqual({ offlineForms: false, submitToEmail: false });
    });

    it('populates the active map from the backend response and reflects it via isActive', async () => {
      featureFlagService.check.mockResolvedValueOnce({
        data: { offlineForms: true },
      });

      await store.resolveForContext({ formId: 'a-form-id' });

      expect(store.isActive('offlineForms')).toBe(true);
      expect(store.isActive('submitToEmail')).toBe(false);
    });

    it('clears the active map on a resolution error (fails safe)', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      store.active = { offlineForms: true };
      featureFlagService.check.mockRejectedValueOnce(new Error('boom'));

      await store.resolveForContext({});

      expect(store.active).toEqual({});
    });
  });
});
