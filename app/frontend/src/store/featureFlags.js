import { defineStore } from 'pinia';

import featureFlagService from '~/services/featureFlagService';
import { useAppStore } from '~/store/app';

export const useFeatureFlagStore = defineStore('featureFlag', {
  state: () => ({
    // Context-resolved active map { <code>: boolean } from GET /features/check.
    // Empty until resolveForContext runs; unknown codes default to inactive.
    active: {},
  }),
  getters: {
    /**
     * Global master switch for a feature, read from the /config `features`
     * catalogue bootstrapped into appStore.config. Handles the string "false"
     * that node-config emits in deployed environments.
     *
     * NOTE: this is NOT allowlist-aware. Use it only for globally-scoped UI
     * (e.g. nav items). For allowlist-gated buttons use isActive(code).
     */
    isEnabled: () => (code) => {
      const appStore = useAppStore();
      const val = appStore.config?.features?.[code]?.enabled;
      if (val === undefined || val === null) return false;
      if (typeof val === 'string') return val.toLowerCase() !== 'false';
      return Boolean(val);
    },

    /**
     * Whether a feature is active for the most recently resolved context
     * (enabled AND allowlisted by form/tenant). Defaults to false until
     * resolveForContext() has populated the cache.
     */
    isActive: (state) => (code) => Boolean(state.active[code]),
  },
  actions: {
    /**
     * Resolve all features for a form/tenant context via the backend and cache
     * the { <code>: active } result for synchronous isActive() reads.
     *
     * Fails safe: on error the active map is cleared (all features inactive),
     * so a resolution failure can never leave a gated feature switched on.
     *
     * @param {Object} [ctx={}] { formId, tenantId } — non-UUID values are
     *   ignored server-side.
     * @returns {Promise<Object>} the resolved active map
     */
    async resolveForContext({ formId, tenantId } = {}) {
      try {
        const params = {};
        if (formId) params.formId = formId;
        if (tenantId) params.tenantId = tenantId;
        const response = await featureFlagService.check(params);
        this.active = response.data ?? {};
      } catch (error) {
        console.error(`Failed to resolve feature flags: ${error}`); // eslint-disable-line no-console
        this.active = {};
      }
      return this.active;
    },
  },
});
