// @vitest-environment happy-dom
// happy-dom is required to access window.location
import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import getRouter from '~/router';

import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';
import { useAppStore } from '~/store/app';
import { rbacService } from '~/services';

vi.mock('~/services', () => ({
  rbacService: {
    getCurrentUser: vi.fn(),
  },
}));

describe('auth actions', () => {
  let router = getRouter();
  const replaceSpy = vi.spyOn(router, 'replace');
  const windowReplaceSpy = vi.spyOn(window.location, 'replace');
  const windowAssignSpy = vi.spyOn(window.location, 'assign');
  setActivePinia(createPinia());
  const mockStore = useAuthStore();
  const formStore = useFormStore();
  const idpStore = useIdpStore();
  const appStore = useAppStore();

  idpStore.providers = require('../../fixtures/identityProviders.json');

  describe('login', () => {
    beforeEach(() => {
      mockStore.$reset();
      formStore.$reset();
      appStore.$reset();
      mockStore.keycloak = {
        createLoginUrl: vi.fn().mockResolvedValue('about:blank'),
        createLogoutUrl: vi.fn(() => 'about:blank'),
      };
      replaceSpy.mockReset();
      windowReplaceSpy.mockReset();
      router.replace.mockReset();
      appStore.config = { basePath: '/app' };
    });

    it('should do nothing if keycloak is not ready', async () => {
      mockStore.ready = false;

      await mockStore.login();

      expect(windowReplaceSpy).toHaveBeenCalledTimes(0);
    });

    it('should update redirectUri if not defined', async () => {
      mockStore.ready = true;
      mockStore.redirectUri = undefined;

      await mockStore.login('test');

      expect(windowReplaceSpy).toHaveBeenCalledTimes(1);
      // Expecting location.toString() instead of 'about:blank'
      expect(mockStore.redirectUri).toBeTruthy();
    });

    it('should not update redirectUri if already defined', async () => {
      mockStore.ready = true;
      mockStore.redirectUri = 'value';

      await mockStore.login('test');

      expect(windowReplaceSpy).toHaveBeenCalledTimes(1);
      expect(mockStore.redirectUri).toEqual('value');
    });

    it('should navigate with provided idpHint', async () => {
      mockStore.ready = true;
      mockStore.redirectUri = 'value';

      await mockStore.login('test');

      expect(windowReplaceSpy).toHaveBeenCalledTimes(1);
    });

    it('should navigate with pinia store idpHint', async () => {
      mockStore.ready = true;
      mockStore.redirectUri = undefined;
      formStore.form = { idps: ['test'] };

      await mockStore.login();

      expect(replaceSpy).toHaveBeenCalledTimes(1);
      expect(replaceSpy).toHaveBeenCalledWith({
        name: 'Login',
        query: { idpHint: idpStore.loginIdpHints },
      });
    });

    // TODO: Figure out how to mock and intercept vue-router instantiation
    // it('should router navigate to login page without idpHint', () => {
    //   mockStore.ready = true;
    //   mockStore.redirectUri = undefined;
    //   mockStore.rootGetters['form/form'] = { idps: [] };

    //   mockStore.login(mockStore);

    //   expect(mockStore.commit).toHaveBeenCalledTimes(1);
    //   expect(replaceSpy).toHaveBeenCalledTimes(0);
    //   expect(mockStore.getters.createLoginUrl).toHaveBeenCalledTimes(0);
    // });
  });

  describe('updateKeycloak', () => {
    beforeEach(() => {
      mockStore.$reset();
    });

    it('should normalize azureidir code to idir via canonicalCode', async () => {
      rbacService.getCurrentUser.mockResolvedValue({
        data: { idpUserId: 'guid', username: 'testuser', firstName: 'Test', lastName: 'User', fullName: 'Test User', email: 'test@test.com', idp: 'azureidir', public: false },
      });

      mockStore.updateKeycloak({}, true);
      await vi.waitFor(() => expect(mockStore.currentUser.idp.code).toBe('idir'));

      expect(mockStore.currentUser.idp.code).toBe('idir');
      expect(mockStore.currentUser.idp.idpCode).toBe('azureidir');
    });

    it('should set code and idpCode to idir for regular IDIR login', async () => {
      rbacService.getCurrentUser.mockResolvedValue({
        data: { idpUserId: 'guid', username: 'testuser', firstName: 'Test', lastName: 'User', fullName: 'Test User', email: 'test@test.com', idp: 'idir', public: false },
      });

      mockStore.updateKeycloak({}, true);
      await vi.waitFor(() => expect(mockStore.currentUser.idp.code).toBe('idir'));

      expect(mockStore.currentUser.idp.code).toBe('idir');
      expect(mockStore.currentUser.idp.idpCode).toBe('idir');
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      mockStore.$reset();
      mockStore.keycloak = {
        createLoginUrl: vi.fn(() => 'about:blank'),
      };
      mockStore.logoutUrl = location.origin;
      windowAssignSpy.mockReset();
    });

    it('should do nothing if keycloak is not ready', () => {
      mockStore.ready = false;
      mockStore.logout();

      expect(windowAssignSpy).toHaveBeenCalledTimes(0);
    });

    it('should trigger navigation action if keycloak is ready', () => {
      mockStore.ready = true;
      mockStore.logout();

      expect(windowAssignSpy).toHaveBeenCalledTimes(1);
    });
  });
});
