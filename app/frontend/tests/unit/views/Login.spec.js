import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import i18n from '@/internationalization';
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
      i18n
    });
    await localVue.nextTick();

    expect(wrapper.html()).toMatch('router-link');
  });
});
