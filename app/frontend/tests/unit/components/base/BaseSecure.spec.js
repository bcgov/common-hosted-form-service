import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import BaseSecure from '@/components/base/BaseSecure.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('BaseSecure.vue', () => {
  const { location } = window;
  const mockReplace = jest.fn(cb => {
    cb();
  });
  let store;

  beforeAll(() => {
    delete window.location;
    window.location = {
      replace: mockReplace
    };
  });

  beforeEach(() => {
    mockReplace.mockReset();
    store = new Vuex.Store();
  });

  afterAll(() => {
    window.location = location;
  });

  it('renders nothing if authenticated, user, and admin', () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => true,
        isAdmin: () => true,
        isUser: () => true,
        keycloakReady: () => true
      }
    });

    const wrapper = shallowMount(BaseSecure, { localVue, store });

    expect(wrapper.text()).toMatch('');
  });

  it('renders a message if authenticated, user and not admin', () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => true,
        isAdmin: () => false,
        isUser: () => true,
        keycloakReady: () => true
      }
    });

    const wrapper = shallowMount(BaseSecure, {
      localVue,
      store,
      stubs: ['router-link']
    });

    expect(wrapper.text()).toMatch('You are not authorized to use this feature.');
  });

  it('renders a message if authenticated, not user and not admin', () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => true,
        isAdmin: () => false,
        isUser: () => false,
        keycloakReady: () => true
      }
    });

    const wrapper = shallowMount(BaseSecure, {
      localVue,
      store,
      stubs: ['router-link']
    });

    expect(wrapper.text()).toMatch('Your account is not set up correctly.');
  });

  it('renders a message with login button if unauthenticated', () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => false,
        keycloakReady: () => true
      }
    });

    const wrapper = shallowMount(BaseSecure, { localVue, store });

    expect(wrapper.text()).toMatch('You must be logged in to use this feature.');
  });

  it('renders a message without login button if unauthenticated', () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => false,
        keycloakReady: () => false
      }
    });

    const wrapper = shallowMount(BaseSecure, { localVue, store });

    expect(wrapper.text()).toMatch('You must be logged in to use this feature.');
  });

  it('login button redirects to login url', () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => false,
        createLoginUrl: () => () => 'test',
        keycloakReady: () => true
      }
    });

    const wrapper = shallowMount(BaseSecure, { localVue, store });
    wrapper.vm.login();

    expect(wrapper.text()).toMatch('Login');
    expect(mockReplace).toHaveBeenCalledTimes(1);
  });
});
