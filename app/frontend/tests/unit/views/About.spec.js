import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuetify from 'vuetify';
import Vuex from 'vuex';

import About from '@/views/About.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('About.vue', () => {
  let store;
  const vuetify = new Vuetify();

  beforeEach(() => {
    store = new Vuex.Store();
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => true,
        isAdmin: () => false,
        keycloakReady: () => true,
        // eslint-disable-next-line no-unused-vars
        createLoginUrl: () => () => 'testurl',
      },
    });
  });

  it('renders', () => {
    const wrapper = shallowMount(About, {
      localVue,
      store,
      stubs: ['router-link', 'BaseImagePopout'],
      vuetify,
    });

    expect(wrapper.html()).toMatch('Create, publish forms, and receive submissions');
  });
});
