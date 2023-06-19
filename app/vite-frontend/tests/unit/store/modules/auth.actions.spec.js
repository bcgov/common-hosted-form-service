import { cloneDeep } from 'lodash';
import Vue from 'vue';

import store from '@/store/modules/auth';

describe('auth actions', () => {
  const { location } = window;
  const mockReplace = jest.fn((cb) => {
    cb();
  });
  const mockStore = {
    commit: jest.fn(),
    getters: {
      createLoginUrl: jest.fn(),
      createLogoutUrl: jest.fn(),
    },
    rootGetters: {},
    state: cloneDeep(store.state),
  };

  beforeAll(() => {
    delete window.location;
    window.location = {
      replace: mockReplace,
    };
    Vue.prototype.$config = { basePath: 'test' };
  });

  beforeEach(() => {
    Object.keys(mockStore).forEach((f) => {
      if (jest.isMockFunction(f)) f.mockReset();
    });
    mockStore.state = cloneDeep(store.state);
  });

  afterAll(() => {
    window.location = location;
    Vue.prototype.$config = undefined;
  });

  describe('login', () => {
    beforeEach(() => {
      mockStore.commit.mockReset();
      mockStore.getters.createLoginUrl.mockReset();
      delete mockStore.getters.keycloakReady;
      delete mockStore.getters.redirectUri;
      delete mockStore.rootGetters['form/form'];
      mockReplace.mockReset();
    });

    it('should do nothing if keycloak is not ready', () => {
      mockStore.getters.keycloakReady = false;
      store.actions.login(mockStore);

      expect(mockStore.commit).toHaveBeenCalledTimes(0);
      expect(window.location.replace).toHaveBeenCalledTimes(0);
      expect(mockStore.getters.createLoginUrl).toHaveBeenCalledTimes(0);
    });

    it('should update redirectUri if not defined', () => {
      mockStore.getters.keycloakReady = true;
      mockStore.getters.redirectUri = undefined;

      store.actions.login(mockStore, 'test');

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(window.location.replace).toHaveBeenCalledTimes(1);
      expect(mockStore.getters.createLoginUrl).toHaveBeenCalledTimes(1);
    });

    it('should not update redirectUri if already defined', () => {
      mockStore.getters.keycloakReady = true;
      mockStore.getters.redirectUri = 'value';

      store.actions.login(mockStore, 'test');

      expect(mockStore.commit).toHaveBeenCalledTimes(0);
      expect(window.location.replace).toHaveBeenCalledTimes(1);
      expect(mockStore.getters.createLoginUrl).toHaveBeenCalledTimes(1);
    });

    it('should navigate with provided idpHint', () => {
      mockStore.getters.keycloakReady = true;
      mockStore.getters.redirectUri = 'value';

      store.actions.login(mockStore, 'test');

      expect(mockStore.commit).toHaveBeenCalledTimes(0);
      expect(window.location.replace).toHaveBeenCalledTimes(1);
      expect(mockStore.getters.createLoginUrl).toHaveBeenCalledTimes(1);
    });

    it('should navigate with vuex store idpHint', () => {
      mockStore.getters.keycloakReady = true;
      mockStore.getters.redirectUri = undefined;
      mockStore.rootGetters['form/form'] = { idps: ['test'] };

      store.actions.login(mockStore);

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(window.location.replace).toHaveBeenCalledTimes(1);
      expect(mockStore.getters.createLoginUrl).toHaveBeenCalledTimes(1);
    });

    // TODO: Figure out how to mock and intercept vue-router instantiation
    // it('should router navigate to login page without idpHint', () => {
    //   mockStore.getters.keycloakReady = true;
    //   mockStore.getters.redirectUri = undefined;
    //   mockStore.rootGetters['form/form'] = { idps: [] };

    //   store.actions.login(mockStore);

    //   expect(mockStore.commit).toHaveBeenCalledTimes(1);
    //   expect(window.location.replace).toHaveBeenCalledTimes(0);
    //   expect(mockStore.getters.createLoginUrl).toHaveBeenCalledTimes(0);
    // });
  });

  describe('logout', () => {
    beforeEach(() => {
      mockStore.getters.createLogoutUrl.mockReset();
      delete mockStore.getters.keycloakReady;
      mockReplace.mockReset();
    });

    it('should do nothing if keycloak is not ready', () => {
      mockStore.getters.keycloakReady = false;
      store.actions.logout(mockStore);

      expect(window.location.replace).toHaveBeenCalledTimes(0);
      expect(mockStore.getters.createLogoutUrl).toHaveBeenCalledTimes(0);
    });

    it('should trigger navigation action if keycloak is ready', () => {
      mockStore.getters.keycloakReady = true;
      store.actions.logout(mockStore);

      expect(window.location.replace).toHaveBeenCalledTimes(1);
      expect(mockStore.getters.createLogoutUrl).toHaveBeenCalledTimes(1);
    });
  });
});
