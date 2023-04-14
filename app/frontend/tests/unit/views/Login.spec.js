import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import Login from '@/views/Login.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Login.vue', () => {
  let store;

  beforeEach(() => {
    store = new Vuex.Store();
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => true,
        keycloakReady: () => true,
        createLoginUrl: () => () => 'testurl',
      },
      actions: {
        login: () => jest.fn(),
      },
    });
  });

  it('renders without error', async () => {
    const wrapper = shallowMount(Login, {
      localVue,
      store,
      stubs: ['router-link'],
    });
    await localVue.nextTick();

    expect(wrapper.html()).toMatch('router-link');
  });
});
