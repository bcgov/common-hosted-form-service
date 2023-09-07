import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import i18n from '@/internationalization';
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
        keycloakReady: () => true
      },
      actions: {
        logout: () => jest.fn()
      }
    });
  });

  it('renders without error', async () => {
    const wrapper = shallowMount(Error, {
      localVue,
      store,
      i18n
    });
    await localVue.nextTick();

    const h1 = wrapper.find('h1');
    expect(h1.exists()).toBe(true);
    expect(h1.text()).toMatch('Error: Something went wrong... :(');
  });
});
