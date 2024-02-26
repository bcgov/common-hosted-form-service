// @vitest-environment happy-dom
// happy-dom is required to access window.location

import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { expect, vi } from 'vitest';

import getRouter from '~/router';
import BaseSecure from '~/components/base/BaseSecure.vue';
import { useAuthStore } from '~/store/auth';
import { useIdpStore } from '~/store/identityProviders';
import { AppPermissions } from '~/utils/constants';

describe('BaseSecure.vue', () => {
  const pinia = createPinia();
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  setActivePinia(pinia);
  const authStore = useAuthStore();
  const idpStore = useIdpStore();

  idpStore.providers = require('../../fixtures/identityProviders.json');
  const nonPrimaryIdp = idpStore.providers.find(
    (x) => x.active && x.login && !x.primary
  );

  it('renders nothing if authenticated, user', () => {
    authStore.authenticated = true;
    authStore.ready = true;
    authStore.keycloak = {
      tokenParsed: {
        client_roles: [],
        identity_provider: nonPrimaryIdp.code,
      },
    };
    const wrapper = mount(BaseSecure, {
      global: {
        plugins: [router, pinia],
      },
    });

    expect(wrapper.text()).toEqual('');
  });

  it('renders a message if admin required, not admin', () => {
    authStore.authenticated = true;
    authStore.ready = true;
    authStore.keycloak = {
      tokenParsed: {
        client_roles: [],
        identity_provider: nonPrimaryIdp.code,
        },
      };

    const wrapper = mount(BaseSecure, {
      props: {
        admin: true,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    expect(wrapper.text()).toContain('trans.baseSecure.401UnAuthorizedErrMsg');
  });

  it('renders nothing if admin required, user is admin', () => {
    authStore.authenticated = true;
    authStore.ready = true;
    authStore.keycloak = {
      tokenParsed: {
        client_roles: ['admin'],
        identity_provider: nonPrimaryIdp.code,
      },
    };
    const wrapper = mount(BaseSecure, {
      props: {
        admin: true,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    expect(wrapper.text()).toMatch('');
  });

  it('renders a message with login button if unauthenticated', () => {
    authStore.authenticated = false;
    authStore.ready = true;
    authStore.keycloak = {};
    const wrapper = mount(BaseSecure, {
      props: {
        admin: true,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    expect(wrapper.text()).toMatch('trans.baseSecure.loginInfo');
  });

  it('renders a message without login button if unauthenticated', () => {
    authStore.authenticated = false;
    authStore.ready = false;
    authStore.keycloak = {};
    const wrapper = mount(BaseSecure, {
      props: {
        admin: true,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    expect(wrapper.text()).toMatch('trans.baseSecure.loginInfo');
  });

  it('login button redirects to login url', async () => {
    authStore.authenticated = false;
    authStore.ready = true;
    authStore.keycloak = {};
    const loginSpy = vi.spyOn(authStore, 'login');
    const wrapper = mount(BaseSecure, {
      props: {
        admin: true,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    const loginBtn = wrapper.find('[data-test="login-btn"]');
    await loginBtn.trigger('click');
    expect(loginSpy).toHaveBeenCalledTimes(1);
  });

  it('renders a message with 403 if identity provider does not exist', () => {
    authStore.authenticated = true;
    authStore.ready = true;
    authStore.keycloak = {
      tokenParsed: {
          client_roles: [],
          identity_provider: 'fake', //nonPrimaryIdp.code,
        },
    };
    const wrapper = mount(BaseSecure, {
      props: {
        admin: false,
        permission: AppPermissions.VIEWS_ADMIN,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    expect(wrapper.text()).toMatch('trans.baseSecure.403Forbidden');
  });
});
