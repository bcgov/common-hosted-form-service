// @vitest-environment happy-dom
// happy-dom is required to access window.location
import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import getRouter from '~/router';

import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';
import { useAppStore } from '~/store/app';

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
        createLoginUrl: vi.fn(() => 'about:blank'),
        createLogoutUrl: vi.fn(() => 'about:blank'),
      };
      replaceSpy.mockReset();
      windowReplaceSpy.mockReset();
      router.replace.mockReset();
      appStore.config = { basePath: '/app' };
    });

    it('should do nothing if keycloak is not ready', () => {
      mockStore.ready = false;
      mockStore.login();

      expect(windowReplaceSpy).toHaveBeenCalledTimes(0);
    });

    it('should update redirectUri if not defined', () => {
      mockStore.ready = true;
      mockStore.redirectUri = undefined;

      mockStore.login('test');

      expect(windowReplaceSpy).toHaveBeenCalledTimes(1);
      expect(mockStore.redirectUri).toEqual('about:blank');
    });

    it('should not update redirectUri if already defined', () => {
      mockStore.ready = true;
      mockStore.redirectUri = 'value';

      mockStore.login('test');

      expect(windowReplaceSpy).toHaveBeenCalledTimes(1);
      expect(mockStore.redirectUri).toEqual('value');
    });

    it('should navigate with provided idpHint', () => {
      mockStore.ready = true;
      mockStore.redirectUri = 'value';

      mockStore.login('test');

      expect(windowReplaceSpy).toHaveBeenCalledTimes(1);
    });

    it('should navigate with pinia store idpHint', () => {
      mockStore.ready = true;
      mockStore.redirectUri = undefined;
      formStore.form = { idps: ['test'] };

      mockStore.login();

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
