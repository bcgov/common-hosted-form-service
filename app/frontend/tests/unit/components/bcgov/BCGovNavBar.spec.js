import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuetify from 'vuetify';
import Vuex from 'vuex';

import BCGovNavBar from '@/components/bcgov/BCGovNavBar.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('BCGovNavBar.vue', () => {
  let store;
  const vuetify = new Vuetify();

  beforeEach(() => {
    store = new Vuex.Store();
  });

  it('renders as non-admin', () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        identityProvider: () => 'idir',
        authenticated: () => true,
        isAdmin: () => false,
        keycloakReady: () => true,
      },
    });

    const wrapper = shallowMount(BCGovNavBar, {
      localVue,
      mocks: {
        $route: {
          meta: {},
        },
      },
      store,
      stubs: ['router-link'],
      vuetify,
    });

    expect(wrapper.text()).toContain('About');
    expect(wrapper.text()).toContain('My Forms');
  });

  it('renders as admin', () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        identityProvider: () => 'idir',
        authenticated: () => true,
        isAdmin: () => true,
        keycloakReady: () => true,
      },
    });

    const wrapper = shallowMount(BCGovNavBar, {
      localVue,
      mocks: {
        $route: {
          meta: {},
        },
      },
      store,
      stubs: ['router-link'],
      vuetify,
    });

    expect(wrapper.text()).toContain('About');
    expect(wrapper.text()).toContain('My Forms');
    expect(wrapper.text()).toContain('Create a New Form');
    expect(wrapper.text()).toContain('Admin');
  });
});
