// @vitest-environment happy-dom
// happy-dom is required to access window.location

import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { expect, vi } from 'vitest';

import getRouter from '~/router';
import BaseAuthButton from '~/components/base/BaseAuthButton.vue';
import { useAuthStore } from '~/store/auth';
import { useIdpStore } from '~/store/identityProviders';
import { useAppStore } from '~/store/app';

describe('BaseAuthButton.vue', () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const authStore = useAuthStore();
  const idpStore = useIdpStore();
  const appStore = useAppStore();
  const router = getRouter();
  const windowReplaceSpy = vi.spyOn(window.location, 'assign');
  idpStore.providers = require('../../fixtures/identityProviders.json');

  beforeEach(async () => {
    windowReplaceSpy.mockReset();
    appStore.$reset();
    appStore.config = {
      basePath: '/app'
    };
    authStore.$reset();
    authStore.keycloak = {
      createLoginUrl: vi.fn((opts) => opts),
      clientId: 'clientid'
    };
    router.currentRoute.value.meta.hasLogin = true;
    router.push('/');
    await router.isReady();
  });

  it('renders nothing when not authenticated and does not hasLogin', () => {
    authStore.authenticated = false;
    authStore.ready = true;
    router.currentRoute.value.meta.hasLogin = false;
    const wrapper = mount(BaseAuthButton, {
      global: {
        plugins: [router, pinia],
      },
    });

    expect(wrapper.text()).toEqual('');
  });

  it('renders login when not authenticated and hasLogin', () => {
    authStore.authenticated = false;
    authStore.ready = true;
    const wrapper = mount(BaseAuthButton, {
      global: {
        plugins: [router, pinia],
      },
    });

    wrapper.vm.$route.meta.hasLogin = true;

    expect(wrapper.text()).toEqual('trans.baseAuthButton.login');
  });

  it('renders logout when authenticated', () => {
    authStore.authenticated = true;
    authStore.ready = true;
    const wrapper = mount(BaseAuthButton, {
      global: {
        plugins: [router, pinia],
      },
    });

    expect(wrapper.text()).toEqual('trans.baseAuthButton.logout');
  });

  it('renders nothing if keycloak is not ready', () => {
    authStore.authenticated = false;
    authStore.ready = false;
    const wrapper = mount(BaseAuthButton, {
      global: {
        plugins: [router, pinia],
      },
    });

    expect(wrapper.text()).toBeFalsy();
  });

  it('login button redirects to login url', async () => {
    authStore.authenticated = false;
    authStore.ready = true;
    const wrapper = mount(BaseAuthButton, {
      global: {
        plugins: [router, pinia],
      },
    });

    const replace = vi.spyOn(router, 'replace');

    wrapper.vm.login();
    expect(wrapper.text()).toMatch('trans.baseAuthButton.login');
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith({
      name: 'Login',
      query: { idpHint: idpStore.loginIdpHints },
    });
  });

  it('logout button redirects to logout url', async () => {
    authStore.authenticated = true;
    authStore.logoutUrl = 'http://redirect.com/logout';
    authStore.keycloak
    authStore.ready = true;
    const wrapper = mount(BaseAuthButton, {
      global: {
        plugins: [router, pinia],
      },
    });

    wrapper.vm.logout();
    expect(wrapper.text()).toMatch('trans.baseAuthButton.logout');
    expect(windowReplaceSpy).toHaveBeenCalledTimes(1);
    const params = encodeURIComponent(`post_logout_redirect_uri=null/app&client_id=clientid`)
    expect(windowReplaceSpy).toHaveBeenCalledWith(`http://redirect.com/logout?${params}`);
  });
});
