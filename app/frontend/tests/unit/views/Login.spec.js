import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import { useAuthStore } from '~/store/auth';
import Login from '~/views/Login.vue';
import { useIdpStore } from '~/store/identityProviders';

describe('Login.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const authStore = useAuthStore(pinia);
  const idpStore = useIdpStore(pinia);

  idpStore.providers = require('../fixtures/identityProviders.json');

  beforeEach(() => {
    authStore.$reset();
  });

  it('shows error if keycloak is not ready', async () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: true,
        },
      },
    });

    await nextTick();

    expect(wrapper.text()).toMatch(
      'Identity and Access Management not ready, please contact technical support.'
    );
  });

  it('shows already logged in if ready and authenticated', async () => {
    authStore.authenticated = true;
    authStore.ready = true;
    const wrapper = mount(Login, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: true,
        },
      },
    });

    await nextTick();

    expect(wrapper.text()).toMatch('trans.login.alreadyLoggedIn');
  });

  it('shows login options', async () => {
    authStore.authenticated = false;
    authStore.ready = true;
    const wrapper = mount(Login, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: true,
        },
      },
    });

    await nextTick();

    Object.values(idpStore.loginButtons).forEach((idp) => {
      const button = wrapper.find(`[data-test="${idp.code}"]`);
      expect(button.exists()).toBeTruthy();
    });
  });

  it('shows supplied login options', async () => {
    const IDPs = ['idir', 'bceid-business'];
    authStore.authenticated = false;
    authStore.ready = true;
    const wrapper = mount(Login, {
      props: {
        idpHint: IDPs,
      },
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: true,
        },
      },
    });

    await nextTick();

    IDPs.forEach((idp) => {
      const button = wrapper.find(`[data-test="${idp}"]`);
      expect(button.exists()).toBeTruthy();
    });
  });
});
