// @vitest-environment happy-dom
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

import { VApp } from 'vuetify/components';
import BCGovNavBar from '~/components/bcgov/BCGovNavBar.vue';
import getRouter from '~/router';
import { useAuthStore } from '~/store/auth';

describe('BCGovNavBar.vue', () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  it('renders as non-admin', async () => {
    const authStore = useAuthStore();
    authStore.keycloak = {
      tokenParsed: {
        identity_provider: 'idir',
        resource_access: {
          chefs: {
            roles: [],
          },
        },
      },
    };
    authStore.authenticated = true;
    authStore.ready = true;

    const wrapper = mount(VApp, {
      global: {
        plugins: [router, pinia],
      },
      slots: {
        default: h(BCGovNavBar),
      },
    });
    const aboutLinks = wrapper.find('[data-cy="aboutLinks"]');
    expect(aboutLinks.exists()).toBeTruthy();
    expect(aboutLinks.text()).toEqual('trans.bCGovNavBar.about');
    const userFormsLinks = wrapper.find('[data-cy="userFormsLinks"]');
    expect(userFormsLinks.exists()).toBeTruthy();
    expect(userFormsLinks.text()).toEqual('trans.bCGovNavBar.myForms');
    const createNewForm = wrapper.find('[data-cy="createNewForm"]');
    expect(createNewForm.exists()).toBeTruthy();
    expect(createNewForm.text()).toEqual('trans.bCGovNavBar.createNewForm');
    const help = wrapper.find('[data-cy="help"]');
    expect(help.exists()).toBeTruthy();
    expect(help.text()).toEqual('trans.bCGovNavBar.help');
    const feedback = wrapper.find('[data-cy="feedback"]');
    expect(feedback.exists()).toBeTruthy();
    expect(feedback.text()).toEqual('trans.bCGovNavBar.feedback');
    const admin = wrapper.find('[data-cy="admin"]');
    expect(admin.exists()).toBeFalsy();
  });

  it('renders as admin', () => {
    const authStore = useAuthStore();
    authStore.keycloak = {
      tokenParsed: {
        identity_provider: 'idir',
        resource_access: {
          chefs: {
            roles: ['admin'],
          },
        },
      },
    };
    authStore.authenticated = true;
    authStore.ready = true;

    const wrapper = mount(VApp, {
      global: {
        plugins: [router, pinia],
      },
      slots: {
        default: h(BCGovNavBar),
      },
    });
    const aboutLinks = wrapper.find('[data-cy="aboutLinks"]');
    expect(aboutLinks.exists()).toBeTruthy();
    expect(aboutLinks.text()).toEqual('trans.bCGovNavBar.about');
    const userFormsLinks = wrapper.find('[data-cy="userFormsLinks"]');
    expect(userFormsLinks.exists()).toBeTruthy();
    expect(userFormsLinks.text()).toEqual('trans.bCGovNavBar.myForms');
    const createNewForm = wrapper.find('[data-cy="createNewForm"]');
    expect(createNewForm.exists()).toBeTruthy();
    expect(createNewForm.text()).toEqual('trans.bCGovNavBar.createNewForm');
    const help = wrapper.find('[data-cy="help"]');
    expect(help.exists()).toBeTruthy();
    expect(help.text()).toEqual('trans.bCGovNavBar.help');
    const feedback = wrapper.find('[data-cy="feedback"]');
    expect(feedback.exists()).toBeTruthy();
    expect(feedback.text()).toEqual('trans.bCGovNavBar.feedback');
    const admin = wrapper.find('[data-cy="admin"]');
    expect(admin.exists()).toBeTruthy();
    expect(admin.text()).toEqual('trans.bCGovNavBar.admin');
  });
});
