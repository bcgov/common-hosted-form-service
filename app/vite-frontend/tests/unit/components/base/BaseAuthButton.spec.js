// @vitest-environment happy-dom
// happy-dom is required to access window.location

import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { vi } from 'vitest';

import getRouter from '~/router';
import BaseAuthButton from '~/components/base/BaseAuthButton.vue';
import { useAuthStore } from '~/store/auth';

describe('BaseAuthButton.vue', () => {
  const router = getRouter();
  const windowReplaceSpy = vi.spyOn(window.location, 'replace');

  setActivePinia(createPinia());
  const authStore = useAuthStore();

  beforeEach(async () => {
    windowReplaceSpy.mockReset();
    authStore.$reset();
    authStore.keycloak = {
      createLoginUrl: vi.fn((opts) => opts),
      createLogoutUrl: vi.fn((opts) => opts),
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
        plugins: [router],
      },
    });

    expect(wrapper.text()).toEqual('');
  });

  it('renders login when not authenticated and hasLogin', () => {
    authStore.authenticated = false;
    authStore.ready = true;
    const wrapper = mount(BaseAuthButton, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toEqual('trans.baseAuthButton.login');
  });

  it('renders logout when authenticated', () => {
    authStore.authenticated = true;
    authStore.ready = true;
    const wrapper = mount(BaseAuthButton, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toEqual('trans.baseAuthButton.logout');
  });

  it('renders nothing if keycloak is not ready', () => {
    authStore.authenticated = false;
    authStore.ready = false;
    const wrapper = mount(BaseAuthButton, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toEqual('');
  });

  it('login button redirects to login url', async () => {
    authStore.authenticated = false;
    authStore.ready = true;
    const wrapper = mount(BaseAuthButton, {
      global: {
        plugins: [router],
      },
    });

    const replace = vi.spyOn(router, 'replace');

    expect(wrapper.text()).toMatch('trans.baseAuthButton.login');
    await wrapper.find('button').trigger('click');
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith({
      name: 'Login',
      query: { idpHint: ['idir', 'bceid-business', 'bceid-basic'] },
    });
  });

  it('logout button redirects to logout url', async () => {
    authStore.authenticated = true;
    authStore.ready = true;
    const wrapper = mount(BaseAuthButton, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toMatch('trans.baseAuthButton.logout');
    await wrapper.find('button').trigger('click');
    expect(windowReplaceSpy).toHaveBeenCalledTimes(1);
    expect(windowReplaceSpy).toHaveBeenCalledWith({
      redirectUri: location.origin,
    });
  });
});
