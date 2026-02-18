import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from 'vue';

import { useTenantStore } from '~/store/tenant';
import { useAppStore } from '~/store/app';
import { useAuthStore } from '~/store/auth';
import { useIdpStore } from '~/store/identityProviders';

// Mock services and router
vi.mock('~/services', () => ({
  rbacService: {
    getCurrentUserTenants: vi.fn(),
  },
}));

vi.mock('~/router', () => ({
  default: vi.fn(() => ({
    currentRoute: { value: { meta: {} } },
  })),
}));

import { rbacService } from '~/services';
import getRouter from '~/router';

const identityProviders = [
  {
    code: 'idir',
    display: 'IDIR',
    idp: 'idir',
    primary: true,
    login: true,
    permissions: [],
    roles: [],
    tokenmap: {},
    extra: { sortOrder: 10 },
  },
  {
    code: 'bcservicescard',
    display: 'BC Services Card',
    idp: 'bcservicescard',
    primary: false,
    login: true,
    permissions: [],
    roles: [],
    tokenmap: {},
    extra: { sortOrder: 30 },
  },
];

describe('tenant store', () => {
  let app, pinia, tenantStore, appStore, authStore, idpStore;

  beforeEach(() => {
    app = createApp({});
    pinia = createPinia();
    app.use(pinia);
    setActivePinia(pinia);

    tenantStore = useTenantStore();
    appStore = useAppStore();
    authStore = useAuthStore();
    idpStore = useIdpStore();

    // Set up IDP providers
    idpStore.providers = identityProviders;

    // Default: keycloak with IDIR user
    authStore.keycloak = {
      tokenParsed: { identity_provider: 'idir' },
    };

    // Default: tenant feature enabled
    appStore.config = { tenantFeatureEnabled: true };

    // Clear localStorage
    localStorage.clear();

    vi.clearAllMocks();
  });

  // ---- isTenantFeatureEnabled getter ----

  describe('isTenantFeatureEnabled', () => {
    it('returns true when config is not set (default)', () => {
      appStore.config = {};
      expect(tenantStore.isTenantFeatureEnabled).toBe(true);
    });

    it('returns true when config is null', () => {
      appStore.config = null;
      expect(tenantStore.isTenantFeatureEnabled).toBe(true);
    });

    it('returns true when tenantFeatureEnabled is true', () => {
      appStore.config = { tenantFeatureEnabled: true };
      expect(tenantStore.isTenantFeatureEnabled).toBe(true);
    });

    it('returns true when tenantFeatureEnabled is string "true"', () => {
      appStore.config = { tenantFeatureEnabled: 'true' };
      expect(tenantStore.isTenantFeatureEnabled).toBe(true);
    });

    it('returns false when tenantFeatureEnabled is false', () => {
      appStore.config = { tenantFeatureEnabled: false };
      expect(tenantStore.isTenantFeatureEnabled).toBe(false);
    });

    it('returns false when tenantFeatureEnabled is string "false"', () => {
      appStore.config = { tenantFeatureEnabled: 'false' };
      expect(tenantStore.isTenantFeatureEnabled).toBe(false);
    });

    it('returns false when tenantFeatureEnabled is string "FALSE"', () => {
      appStore.config = { tenantFeatureEnabled: 'FALSE' };
      expect(tenantStore.isTenantFeatureEnabled).toBe(false);
    });
  });

  // ---- isBCServicesCardUser getter ----

  describe('isBCServicesCardUser', () => {
    it('returns false for IDIR user', () => {
      authStore.keycloak = {
        tokenParsed: { identity_provider: 'idir' },
      };
      expect(tenantStore.isBCServicesCardUser).toBe(false);
    });

    it('returns true for BC Services Card user', () => {
      authStore.keycloak = {
        tokenParsed: { identity_provider: 'bcservicescard' },
      };
      expect(tenantStore.isBCServicesCardUser).toBe(true);
    });

    it('returns false when keycloak tokenParsed is null', () => {
      authStore.keycloak = { tokenParsed: null };
      expect(tenantStore.isBCServicesCardUser).toBe(false);
    });
  });

  // ---- initializeStore ----

  describe('initializeStore', () => {
    it('loads selectedTenant from localStorage when feature enabled', () => {
      const tenant = { id: 'tenant-1', name: 'Test Tenant' };
      localStorage.setItem('selectedTenant', JSON.stringify(tenant));

      tenantStore.initializeStore();

      expect(tenantStore.selectedTenant).toEqual(tenant);
    });

    it('skips loading when feature flag is disabled', () => {
      const tenant = { id: 'tenant-1', name: 'Test Tenant' };
      localStorage.setItem('selectedTenant', JSON.stringify(tenant));
      appStore.config = { tenantFeatureEnabled: false };

      tenantStore.initializeStore();

      expect(tenantStore.selectedTenant).toBeNull();
    });

    it('skips loading for BC Services Card users', () => {
      const tenant = { id: 'tenant-1', name: 'Test Tenant' };
      localStorage.setItem('selectedTenant', JSON.stringify(tenant));
      authStore.keycloak = {
        tokenParsed: { identity_provider: 'bcservicescard' },
      };

      tenantStore.initializeStore();

      expect(tenantStore.selectedTenant).toBeNull();
    });

    it('ignores null/undefined stored values', () => {
      localStorage.setItem('selectedTenant', 'null');

      tenantStore.initializeStore();

      expect(tenantStore.selectedTenant).toBeNull();
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem('selectedTenant', 'not-valid-json');

      tenantStore.initializeStore();

      expect(tenantStore.selectedTenant).toBeNull();
      expect(localStorage.getItem('selectedTenant')).toBeNull();
    });
  });

  // ---- fetchTenants ----

  describe('fetchTenants', () => {
    it('fetches tenants from API when feature enabled', async () => {
      const tenants = [
        { id: 't1', name: 'Tenant 1' },
        { id: 't2', name: 'Tenant 2' },
      ];
      rbacService.getCurrentUserTenants.mockResolvedValue({ data: tenants });

      await tenantStore.fetchTenants();

      expect(rbacService.getCurrentUserTenants).toHaveBeenCalled();
      expect(tenantStore.tenants).toEqual(tenants);
      expect(tenantStore.loading).toBe(false);
    });

    it('skips API call when feature flag is disabled', async () => {
      appStore.config = { tenantFeatureEnabled: false };

      await tenantStore.fetchTenants();

      expect(rbacService.getCurrentUserTenants).not.toHaveBeenCalled();
      expect(tenantStore.tenants).toEqual([]);
    });

    it('skips API call for BC Services Card users', async () => {
      authStore.keycloak = {
        tokenParsed: { identity_provider: 'bcservicescard' },
      };

      await tenantStore.fetchTenants();

      expect(rbacService.getCurrentUserTenants).not.toHaveBeenCalled();
      expect(tenantStore.tenants).toEqual([]);
    });

    it('skips API call on formSubmitMode routes', async () => {
      getRouter.mockReturnValue({
        currentRoute: { value: { meta: { formSubmitMode: true } } },
      });

      await tenantStore.fetchTenants();

      expect(rbacService.getCurrentUserTenants).not.toHaveBeenCalled();
    });

    it('clears invalid selected tenant after fetch', async () => {
      tenantStore.selectedTenant = { id: 'old-tenant', name: 'Old' };
      rbacService.getCurrentUserTenants.mockResolvedValue({
        data: [{ id: 't1', name: 'Tenant 1' }],
      });

      await tenantStore.fetchTenants();

      expect(tenantStore.selectedTenant).toBeNull();
    });

    it('preserves valid selected tenant after fetch', async () => {
      const tenant = { id: 't1', name: 'Tenant 1' };
      tenantStore.selectedTenant = tenant;
      rbacService.getCurrentUserTenants.mockResolvedValue({
        data: [tenant],
      });

      await tenantStore.fetchTenants();

      expect(tenantStore.selectedTenant).toEqual(tenant);
    });

    it('handles API error gracefully', async () => {
      rbacService.getCurrentUserTenants.mockRejectedValue(
        new Error('Network error')
      );

      await tenantStore.fetchTenants();

      expect(tenantStore.error).toBe('Network error');
      expect(tenantStore.loading).toBe(false);
    });
  });

  // ---- Other actions ----

  describe('selectTenant', () => {
    it('sets selectedTenant and persists to localStorage', () => {
      const tenant = { id: 't1', name: 'Tenant 1' };
      tenantStore.selectTenant(tenant);

      expect(tenantStore.selectedTenant).toEqual(tenant);
      expect(JSON.parse(localStorage.getItem('selectedTenant'))).toEqual(
        tenant
      );
    });
  });

  describe('clearSelectedTenant', () => {
    it('clears selectedTenant and removes from localStorage', () => {
      tenantStore.selectedTenant = { id: 't1', name: 'Tenant 1' };
      localStorage.setItem(
        'selectedTenant',
        JSON.stringify({ id: 't1', name: 'Tenant 1' })
      );

      tenantStore.clearSelectedTenant();

      expect(tenantStore.selectedTenant).toBeNull();
      expect(localStorage.getItem('selectedTenant')).toBeNull();
    });
  });

  describe('resetTenant', () => {
    it('resets all state to initial values', () => {
      tenantStore.tenants = [{ id: 't1' }];
      tenantStore.selectedTenant = { id: 't1' };
      tenantStore.loading = true;
      tenantStore.error = 'some error';

      tenantStore.resetTenant();

      expect(tenantStore.tenants).toEqual([]);
      expect(tenantStore.selectedTenant).toBeNull();
      expect(tenantStore.loading).toBe(false);
      expect(tenantStore.error).toBeNull();
    });
  });

  // ---- Other getters ----

  describe('getters', () => {
    it('hasTenants returns true when tenants exist', () => {
      tenantStore.tenants = [{ id: 't1' }];
      expect(tenantStore.hasTenants).toBe(true);
    });

    it('hasTenants returns false when no tenants', () => {
      expect(tenantStore.hasTenants).toBe(false);
    });

    it('isFormAdmin returns true when selectedTenant has form_admin role', () => {
      tenantStore.selectedTenant = { id: 't1', roles: ['form_admin'] };
      expect(tenantStore.isFormAdmin).toBe(true);
    });

    it('isFormAdmin returns false when selectedTenant lacks form_admin role', () => {
      tenantStore.selectedTenant = { id: 't1', roles: ['viewer'] };
      expect(tenantStore.isFormAdmin).toBe(false);
    });

    it('isFormAdmin returns false when no selectedTenant', () => {
      expect(tenantStore.isFormAdmin).toBe(false);
    });

    it('tenantsList formats tenants for dropdown', () => {
      tenantStore.tenants = [
        { id: 't1', name: 'Tenant 1', displayName: 'T1' },
        { id: 't2', name: null, displayName: 'Tenant Two' },
      ];

      const list = tenantStore.tenantsList;
      expect(list).toHaveLength(2);
      expect(list[0]).toEqual({
        id: 't1',
        name: 'Tenant 1',
        displayName: 'T1',
        value: 't1',
        text: 'Tenant 1',
      });
      expect(list[1].text).toBe('Tenant Two');
    });
  });
});
