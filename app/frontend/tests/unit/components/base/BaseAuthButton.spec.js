// @vitest-environment happy-dom
// happy-dom is required to access window.location

import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { expect, vi } from 'vitest';
import { useRoute } from 'vue-router';

import BaseAuthButton from '~/components/base/BaseAuthButton.vue';
import { useAuthStore } from '~/store/auth';
import { useIdpStore } from '~/store/identityProviders';
import { useAppStore } from '~/store/app';

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
}));

describe('BaseAuthButton.vue', () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const authStore = useAuthStore();
  const idpStore = useIdpStore();
  const appStore = useAppStore();
  const windowReplaceSpy = vi.spyOn(window.location, 'assign');
  idpStore.providers = require('../../fixtures/identityProviders.json');

  beforeEach(async () => {
    windowReplaceSpy.mockReset();
    appStore.$reset();
    appStore.config = {
      basePath: '/app',
    };
    authStore.$reset();
    authStore.keycloak = {
      createLoginUrl: vi.fn((opts) => opts),
      clientId: 'clientid',
    };
  });

  it('renders nothing when not authenticated and does not hasLogin', () => {
    useRoute.mockImplementationOnce(() => ({
      meta: {
        hasLogin: false,
      },
    }));
    authStore.authenticated = false;
    authStore.ready = true;
    const wrapper = mount(BaseAuthButton, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toEqual('');
  });

  it('renders login when not authenticated and hasLogin', () => {
    useRoute.mockImplementationOnce(() => ({
      meta: {
        hasLogin: true,
      },
    }));
    authStore.authenticated = false;
    authStore.ready = true;
    const wrapper = mount(BaseAuthButton, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toEqual('trans.baseAuthButton.login');
  });

  it('renders logout when authenticated', () => {
    authStore.authenticated = true;
    authStore.ready = true;
    const wrapper = mount(BaseAuthButton, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toEqual('trans.baseAuthButton.logout');
  });

  it('renders nothing if keycloak is not ready', () => {
    authStore.authenticated = false;
    authStore.ready = false;
    const wrapper = mount(BaseAuthButton, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toBeFalsy();
  });

  it('login button redirects to login url', async () => {
    useRoute.mockImplementationOnce(() => ({
      meta: {
        hasLogin: true,
      },
    }));
    const loginSpy = vi.spyOn(authStore, 'login');
    loginSpy.mockImplementationOnce(() => {});
    authStore.authenticated = false;
    authStore.ready = true;
    const wrapper = mount(BaseAuthButton, {
      global: {
        plugins: [pinia],
      },
    });

    await flushPromises();

    const loginButton = wrapper.find('#loginButton');
    expect(loginButton.exists()).toBeTruthy();

    await loginButton.element.click();

    await flushPromises();

    expect(loginSpy).toHaveBeenCalledTimes(1);
  });

  it('logout button redirects to logout url', async () => {
    useRoute.mockImplementationOnce(() => ({
      meta: {
        hasLogin: true,
      },
    }));
    const logoutSpy = vi.spyOn(authStore, 'logout');
    logoutSpy.mockImplementationOnce(() => {});
    authStore.authenticated = true;
    authStore.ready = true;
    const wrapper = mount(BaseAuthButton, {
      global: {
        plugins: [pinia],
      },
    });

    await flushPromises();

    const logoutButton = wrapper.find('#logoutButton');
    expect(logoutButton.exists()).toBeTruthy();

    await logoutButton.element.click();

    await flushPromises();

    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });
});
