import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { setActivePinia, createPinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appAxios } from '~/services/interceptors';
import { useAppStore } from '~/store/app';
import { useAuthStore } from '~/store/auth';
import { useTenantStore } from '~/store/tenant';

// tenant store imports these; mock to avoid side-effects in unit tests
vi.mock('~/store/notification', () => ({
  useNotificationStore: () => ({ addNotification: vi.fn() }),
}));

vi.mock('~/router', () => ({
  default: vi.fn(() => ({ currentRoute: { value: { meta: {} } } })),
}));

describe('appAxios interceptors', () => {
  let authStore, appStore, tenantStore, instance, mock;

  beforeEach(() => {
    setActivePinia(createPinia());
    appStore = useAppStore();
    authStore = useAuthStore();
    tenantStore = useTenantStore();

    // Default: not authenticated, no tenant selected
    authStore.keycloak = { token: null, tokenParsed: null };
    authStore.ready = false;
    authStore.authenticated = false;
    tenantStore.selectedTenant = null;

    // Default pathname: safe non-excluded path
    vi.stubGlobal('location', { pathname: '/forms' });

    instance = appAxios();
    mock = new MockAdapter(instance);
    mock.onAny().reply(200);
  });

  afterEach(() => {
    mock.restore();
    vi.unstubAllGlobals();
  });

  // ── Authorization header ───────────────────────────────────────────────

  describe('Authorization header', () => {
    it('adds Authorization header when authenticated', async () => {
      authStore.ready = true;
      authStore.authenticated = true;
      authStore.keycloak = { token: 'test-token', tokenParsed: {} };

      await instance.get('/test');

      expect(mock.history.get[0].headers['Authorization']).toBe(
        'Bearer test-token'
      );
    });

    it('does not add Authorization header when not authenticated', async () => {
      await instance.get('/test');

      expect(mock.history.get[0].headers['Authorization']).toBeUndefined();
    });

    it('does not add Authorization header when auth not ready', async () => {
      authStore.authenticated = true;
      authStore.ready = false;
      authStore.keycloak = { token: 'test-token', tokenParsed: {} };

      await instance.get('/test');

      expect(mock.history.get[0].headers['Authorization']).toBeUndefined();
    });
  });

  // ── x-tenant-id header ─────────────────────────────────────────────────

  describe('x-tenant-id header', () => {
    beforeEach(() => {
      tenantStore.selectedTenant = { id: 'tenant-abc' };
    });

    it('adds x-tenant-id header for a normal path', async () => {
      await instance.get('/test');

      expect(mock.history.get[0].headers['x-tenant-id']).toBe('tenant-abc');
    });

    it.each([
      '/form/submit',
      '/form/success',
      '/user/view',
      '/user/draft',
      '/user/duplicate',
    ])(
      'does NOT add x-tenant-id for excluded path: %s',
      async (excludedPath) => {
        vi.stubGlobal('location', { pathname: excludedPath });

        await instance.get('/test');

        expect(
          mock.history.get[0].headers['x-tenant-id']
        ).toBeUndefined();
      }
    );

    it('does NOT add x-tenant-id when no tenant is selected', async () => {
      tenantStore.selectedTenant = null;

      await instance.get('/test');

      expect(mock.history.get[0].headers['x-tenant-id']).toBeUndefined();
    });

    it('does NOT add x-tenant-id when selected tenant has no id', async () => {
      tenantStore.selectedTenant = { name: 'No ID Tenant' };

      await instance.get('/test');

      expect(mock.history.get[0].headers['x-tenant-id']).toBeUndefined();
    });
  });

  // ── Response interceptor – 503 ──────────────────────────────────────────

  describe('response interceptor', () => {
    // Reset the catch-all 200 handler before each 503 test so the specific
    // 503 reply is not shadowed by the beforeEach onAny().reply(200).
    beforeEach(() => {
      mock.reset();
    });

    it('dispatches service-unavailable custom event on 503', async () => {
      mock.onGet('/test').reply(503, { details: 'Service is down' });
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      await instance.get('/test').catch(() => {});

      expect(dispatchSpy).toHaveBeenCalledOnce();
      const event = dispatchSpy.mock.calls[0][0];
      expect(event).toBeInstanceOf(CustomEvent);
      expect(event.type).toBe('service-unavailable');
      expect(event.detail).toBe('Service is down');
    });

    it('does NOT dispatch event for non-503 errors', async () => {
      mock.onGet('/test').reply(400);
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      await instance.get('/test').catch(() => {});

      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('passes the error as detail when response has no details field', async () => {
      mock.onGet('/test').reply(503, {});
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      await instance.get('/test').catch(() => {});

      expect(dispatchSpy).toHaveBeenCalledOnce();
      const event = dispatchSpy.mock.calls[0][0];
      expect(event.type).toBe('service-unavailable');
    });

    it('rejects the promise after a 503 response', async () => {
      mock.onGet('/test').reply(503);

      await expect(instance.get('/test')).rejects.toThrow();
    });
  });
});
