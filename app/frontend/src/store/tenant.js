import { defineStore } from 'pinia';
import { rbacService } from '~/services';
import { useAppStore } from '~/store/app';
import { useAuthStore } from '~/store/auth';
import { useNotificationStore } from '~/store/notification';
import getRouter from '~/router';
import { i18n } from '~/internationalization';

// Safe Web Storage wrappers. Reads/writes/removes can throw when storage is
// disabled (private browsing, browser security setting) or full (quota
// exceeded). Restore tokens and the cached selectedTenant are best-effort UX
// state — on any failure we fall back to "no value", which downgrades to a
// fresh-login experience without breaking the app.
function safeStorageGet(storage, key) {
  try {
    return storage.getItem(key);
  } catch (e) {
    return null;
  }
}

function safeStorageSet(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch (e) {
    /* swallow: see safeStorageGet — storage may be disabled or full */
  }
}

function safeStorageRemove(storage, key) {
  try {
    storage.removeItem(key);
  } catch (e) {
    /* swallow: see safeStorageGet — storage may be disabled */
  }
}

function safeJsonParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// Hydrate selectedTenant and isRestoring synchronously from storage at store
// creation time. Pinia's state() runs before any component renders, so doing
// this here prevents the banner/title from flashing "Personal CHEFS" on the
// first paint of a post-login page load.
function hydrateSelectedTenant() {
  const stored = safeStorageGet(localStorage, 'selectedTenant');
  if (!stored || stored === 'null' || stored === 'undefined') return null;
  return safeJsonParse(stored);
}

function hydrateIsRestoring(selectedTenant) {
  // Already have a selectedTenant from localStorage → nothing to restore;
  // render with the known tenant immediately.
  if (selectedTenant) return false;
  if (safeStorageGet(sessionStorage, 'tenantSessionRestore')) return true;
  if (safeStorageGet(localStorage, 'tenantLoginRestore')) return true;
  return false;
}

export const useTenantStore = defineStore('tenant', {
  state: () => {
    const selectedTenant = hydrateSelectedTenant();
    return {
      tenants: [], // List of available tenants
      selectedTenant, // Currently selected tenant (persisted to localStorage)
      loading: false, // Loading state for API calls
      error: null, // Error message if any
      serviceDegraded: false, // True when X-Tenant-Service-Status: degraded header received
      // True while a post-login tenant restore is in flight. Components that
      // depend on selectedTenant (banner, title, forms list) should wait on
      // this to avoid flashing Personal CHEFS before the tenant lands.
      isRestoring: hydrateIsRestoring(selectedTenant),
    };
  },

  getters: {
    /**
     * Whether tenant (Enterprise CHEFS) features are enabled.
     * Reads from app config; handles string "false" from node-config.
     * Defaults to true if not set (backward compatible).
     */
    isTenantFeatureEnabled: () => {
      const appStore = useAppStore();
      const val = appStore.config?.tenantFeatureEnabled;
      if (val === undefined || val === null) return true;
      if (typeof val === 'string') return val.toLowerCase() !== 'false';
      return Boolean(val);
    },

    /**
     * Whether the current user logged in via BC Services Card.
     * BCSC users don't participate in tenant features.
     */
    isBCServicesCardUser: () => {
      const authStore = useAuthStore();
      return authStore.identityProvider?.code === 'bcservicescard';
    },

    /**
     * Get the current selected tenant
     */
    currentTenant: (state) => state.selectedTenant,

    /**
     * True while a post-login tenant restore is in flight. Single source of
     * truth used by:
     *   - router guard (waitForTenantContext)
     *   - App.vue (centered loader, title suffix suppression)
     *   - BCGovEnterpriseBanner (restoring banner state)
     *
     * Three conditions must hold:
     *   1. No selectedTenant yet — once one is loaded, restore is moot.
     *   2. isRestoring flag is true (hydrated from storage tokens at boot,
     *      maintained by fetchTenants while it runs).
     *   3. User is authenticated and auth is ready — otherwise fetchTenants
     *      won't be triggered (handleFirstTransition gates on auth), so
     *      blocking the UI on a restore that will never run causes a
     *      deadlock. Returning enterprise users with selectedTenant cached
     *      skip the loader entirely; unauthenticated users see the normal
     *      login prompt instead of a stuck spinner.
     */
    isTenantRestoring: (state) => {
      if (state.selectedTenant) return false;
      if (!state.isRestoring) return false;
      const appStore = useAppStore();
      const val = appStore.config?.tenantFeatureEnabled;
      const featureEnabled =
        val === undefined || val === null
          ? true
          : typeof val === 'string'
          ? val.toLowerCase() !== 'false'
          : Boolean(val);
      if (!featureEnabled) return false;
      const authStore = useAuthStore();
      if (!authStore.ready || !authStore.authenticated) return false;
      return true;
    },

    /**
     * Get tenant by ID
     */
    getTenantById: (state) => (tenantId) => {
      return state.tenants.find((t) => t.id === tenantId);
    },

    /**
     * Check if tenants are available
     */
    hasTenants: (state) => state.tenants.length > 0,

    /**
     * Check if the selected tenant has form_admin role
     */
    isFormAdmin: (state) =>
      state.selectedTenant?.roles?.includes('form_admin') ?? false,

    /**
     * Get formatted tenant list for dropdown
     */
    tenantsList: (state) =>
      state.tenants.map((t) => ({
        id: t.id,
        name: t.name || t.displayName,
        displayName: t.displayName,
        value: t.id,
        text: t.name || t.displayName,
      })),
  },

  actions: {
    /**
     * Re-validate the hydrated selectedTenant against the current app/auth
     * context. Hydration runs synchronously at store creation (before
     * appStore/authStore are populated) so it can't enforce the feature flag
     * or BCSC checks. This action runs from App.vue onMounted, after stores
     * are ready, and clears any tenant that shouldn't be carried forward:
     *   - feature flag disabled
     *   - user authenticated via BC Services Card
     *   - stored value is missing, "null"/"undefined" string, or unparseable
     * Corrupted entries are also removed from localStorage.
     */
    initializeStore() {
      if (!this.isTenantFeatureEnabled || this.isBCServicesCardUser) {
        this.selectedTenant = null;
        return;
      }
      const raw = safeStorageGet(localStorage, 'selectedTenant');
      if (!raw || raw === 'null' || raw === 'undefined') {
        this.selectedTenant = null;
        return;
      }
      const parsed = safeJsonParse(raw);
      if (parsed === null) {
        // Corrupted entry — clear it so the user gets a clean slate next load.
        safeStorageRemove(localStorage, 'selectedTenant');
        this.selectedTenant = null;
        return;
      }
      this.selectedTenant = parsed;
    },

    /**
     * Save selected tenant to localStorage
     */
    persistSelectedTenant() {
      if (this.selectedTenant) {
        safeStorageSet(
          localStorage,
          'selectedTenant',
          JSON.stringify(this.selectedTenant)
        );
      } else {
        safeStorageRemove(localStorage, 'selectedTenant');
      }
    },

    /**
     * Fetch all available tenants for the current user
     */
    async fetchTenants() {
      if (!this.isTenantFeatureEnabled || this.isBCServicesCardUser) return;
      if (this.loading) return;
      // Skip tenant API call on submission pages - they don't need tenant info
      try {
        const router = getRouter();
        if (router?.currentRoute?.value?.meta?.formSubmitMode) {
          return;
        }
      } catch (error) {
        console.warn('Router not available during fetchTenants:', error); // eslint-disable-line no-console
      }

      this.loading = true;
      this.error = null;
      // Only flag "restoring" when there's actually a restore token waiting —
      // avoids hiding UI on every tenant refetch (e.g. manual tenant switch).
      this.isRestoring = !!(this.getSessionRestore() || this.getLoginRestore());

      try {
        const response = await rbacService.getCurrentUserTenants();
        this.tenants = response.data || [];
        this.serviceDegraded =
          response.headers?.['x-tenant-service-status']?.toLowerCase() ===
          'degraded';

        if (this.serviceDegraded) {
          useNotificationStore().addNotification({
            text: i18n.t('trans.tenantStore.cstarUnavailable'),
            consoleError:
              'X-Tenant-Service-Status: degraded received from /current/tenants',
          });
        }

        // If user had a previously selected tenant, validate it still exists
        if (
          this.selectedTenant &&
          !this.getTenantById(this.selectedTenant.id)
        ) {
          this.selectedTenant = null;
          this.persistSelectedTenant();
        }

        // Restore previously active tenant after re-login.
        // Priority 1 — session timeout (sessionStorage, tab-scoped):
        //   Written by selectTenant() / onAuthRefreshError, consumed once.
        // Priority 2 — voluntary logout (localStorage, browser-scoped):
        //   Written by selectTenant(), cleared when user picks Personal CHEFS,
        //   intentionally kept through resetTenant() so it survives logout.
        // In both cases the API response is the permission authority — we only
        // restore if the tenant is present in the current user's tenant list.
        const currentUserId = this.currentUserIdForRestore();

        const sessionRestore = this.getSessionRestore();
        if (sessionRestore) {
          if (sessionRestore.userId === currentUserId) {
            const match = this.getTenantById(sessionRestore.tenantId);
            if (match) {
              this.selectedTenant = match;
              this.persistSelectedTenant();
            }
          }
          this.clearSessionRestore(); // always consume — one-time token
        } else {
          const loginRestore = this.getLoginRestore();
          if (loginRestore) {
            if (loginRestore.userId === currentUserId) {
              const match = this.getTenantById(loginRestore.tenantId);
              if (match) {
                this.selectedTenant = match;
                this.persistSelectedTenant();
              }
              // Not consumed — kept as "last used tenant" for future logins.
              // selectTenant() will overwrite it on next explicit selection.
            } else {
              this.clearLoginRestore(); // different user on same browser — drop stale data
            }
          }
        }

        // Don't auto-select first tenant - keep user in Classic CHEFS mode on login
      } catch (error) {
        this.error =
          error.message || i18n.t('trans.tenantStore.errorFetchingTenants');
        useNotificationStore().addNotification({
          text: i18n.t('trans.tenantStore.errorFetchingTenants'),
          consoleError: error,
        });
      } finally {
        this.loading = false;
        this.isRestoring = false;
      }
    },

    /**
     * Select a tenant
     * @param {Object} tenant The tenant object to select
     */
    selectTenant(tenant) {
      this.selectedTenant = tenant;
      this.persistSelectedTenant();
      this.saveSessionRestore(); // tab-scoped: session timeout recovery
      this.saveLoginRestore(); // browser-scoped: voluntary logout recovery
    },

    /**
     * Clear selected tenant (user explicitly chose Personal CHEFS).
     * Also clears the login restore token so that after a voluntary logout
     * the user returns to Personal CHEFS, not the previously active tenant.
     */
    clearSelectedTenant() {
      this.selectedTenant = null;
      this.persistSelectedTenant();
      this.clearLoginRestore();
      this.clearSessionRestore();
    },

    /**
     * Reset Pinia state and localStorage but preserve sessionStorage restore data.
     * Use this on session expiry so the tenant can be recovered after re-login
     * within the same tab.
     */
    clearTenantState() {
      this.tenants = [];
      this.selectedTenant = null;
      this.loading = false;
      this.error = null;
      this.serviceDegraded = false;
      this.isRestoring = false;
      this.persistSelectedTenant();
    },

    /**
     * Reset tenant store to initial state and clear all persisted data including
     * sessionStorage restore. Use this on voluntary logout only.
     */
    resetTenant() {
      this.tenants = [];
      this.selectedTenant = null;
      this.loading = false;
      this.error = null;
      this.serviceDegraded = false;
      this.isRestoring = false;
      this.persistSelectedTenant();
      this.clearSessionRestore();
    },

    /**
     * Resolve a stable identifier for the current user. Tries the Keycloak
     * subject first, then falls back to the parsed token's `sub` claim, then
     * to the RBAC `idpUserId` — some code paths (e.g. right after refresh)
     * may have one populated but not the others.
     */
    currentUserIdForRestore() {
      const authStore = useAuthStore();
      return (
        authStore.keycloak?.subject ||
        authStore.keycloak?.tokenParsed?.sub ||
        authStore.currentUser?.idpUserId ||
        null
      );
    },

    /**
     * Persist {userId, tenantId} to sessionStorage so the tenant can be
     * restored after a session timeout within the same browser tab.
     * sessionStorage is tab-scoped and survives Keycloak redirect-back,
     * so each tab restores its own context independently.
     */
    saveSessionRestore() {
      const userId = this.currentUserIdForRestore();
      const tenantId = this.selectedTenant?.id;
      if (!userId || !tenantId) return;
      safeStorageSet(
        sessionStorage,
        'tenantSessionRestore',
        JSON.stringify({ userId, tenantId })
      );
    },

    getSessionRestore() {
      return safeJsonParse(
        safeStorageGet(sessionStorage, 'tenantSessionRestore')
      );
    },

    clearSessionRestore() {
      safeStorageRemove(sessionStorage, 'tenantSessionRestore');
    },

    /**
     * Persist {userId, tenantId} to localStorage so the tenant can be
     * restored after a voluntary logout + re-login on the same browser.
     * Unlike the sessionStorage token, this is never consumed — it represents
     * "last explicitly selected tenant for this user on this browser" and is
     * overwritten by each selectTenant() call, cleared by clearSelectedTenant().
     */
    saveLoginRestore() {
      const userId = this.currentUserIdForRestore();
      const tenantId = this.selectedTenant?.id;
      if (!userId || !tenantId) return;
      safeStorageSet(
        localStorage,
        'tenantLoginRestore',
        JSON.stringify({ userId, tenantId })
      );
    },

    getLoginRestore() {
      return safeJsonParse(safeStorageGet(localStorage, 'tenantLoginRestore'));
    },

    clearLoginRestore() {
      safeStorageRemove(localStorage, 'tenantLoginRestore');
    },
  },
});
