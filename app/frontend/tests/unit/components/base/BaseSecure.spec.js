import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import i18n from '@/internationalization';
import BaseSecure from '@/components/base/BaseSecure.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('BaseSecure.vue', () => {
  let store;

  beforeEach(() => {
    store = new Vuex.Store();
  });

  it('renders nothing if authenticated, user', () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => true,
        isUser: () => true,
        keycloakReady: () => true,
      },
    });

    const wrapper = shallowMount(BaseSecure, { localVue, store, i18n });

    expect(wrapper.text()).toMatch('');
  });

  it('renders a message if authenticated, not user', () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => true,
        isUser: () => false,
        keycloakReady: () => true
      },
    });

    const wrapper = shallowMount(BaseSecure, {
      localVue,
      store,
      stubs: ['router-link'],
      i18n
    });

    expect(wrapper.text()).toMatch('Unauthorized');
  });

  it('renders a message if admin required, not admin', () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => true,
        isAdmin: () => false,
        isUser: () => true,
        keycloakReady: () => true
      },
    });

    const wrapper = shallowMount(BaseSecure, {
      localVue,
      store,
      stubs: ['router-link'],
      propsData: {
        admin: true
      },
      i18n
    });

    expect(wrapper.text()).toMatch('You do not have permission');
  });

  it('renders nothing if admin required, user is admin', () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => true,
        isAdmin: () => false,
        isUser: () => true,
        keycloakReady: () => true
      },
    });

    const wrapper = shallowMount(BaseSecure, {
      localVue,
      store,
      stubs: ['router-link'],
      propsData: {
        admin: true
      },
      i18n
    });

    expect(wrapper.text()).toMatch('');
  });

  it('renders a message with login button if unauthenticated', () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => false,
        keycloakReady: () => true,
      },
    });

    const wrapper = shallowMount(BaseSecure, { localVue, store, i18n });

    expect(wrapper.text()).toMatch('You must be logged in to use this feature.');
  });

  it('renders a message without login button if unauthenticated', () => {
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => false,
        keycloakReady: () => false,
      },
    });

    const wrapper = shallowMount(BaseSecure, { localVue, store, i18n});

    expect(wrapper.text()).toMatch('You must be logged in to use this feature.');
  });

  it('login button redirects to login url', () => {
    const mockLogin = jest.fn();
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => false,
        keycloakReady: () => true,
      },
      actions: {
        login: mockLogin,
      },
    });

    const wrapper = shallowMount(BaseSecure, { localVue, store, i18n });
    wrapper.vm.login();

    expect(wrapper.text()).toMatch('Login');
    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith(expect.any(Object), undefined);
  });
});
