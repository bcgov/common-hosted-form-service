import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import Error from '@/views/Error.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Error.vue', () => {
  let store;

  beforeEach(() => {
    store = new Vuex.Store();
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => true,
        keycloakReady: () => true,
      },
      actions: {
        logout: () => jest.fn(),
      },
    });
  });

  it('renders without error', async () => {
    const wrapper = shallowMount(Error, {
      localVue,
      store,
    });
    await localVue.nextTick();

    expect(wrapper.html()).toMatch('Error: Something went wrong... :(');
    expect(wrapper.html()).toMatch('Logout');
  });
});
