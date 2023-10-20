import Vue from 'vue';
import getRouter from '@/router';
import { useIdle, useTimestamp, watchPausable } from '@vueuse/core';
import { ref } from 'vue';
import moment from 'moment';

/**
 * @function hasRoles
 * Checks if all elements in `roles` array exists in `tokenRoles` array
 * @param {string[]} tokenRoles An array of roles that exist in the token
 * @param {string[]} roles An array of roles to check
 * @returns {boolean} True if all `roles` exist in `tokenRoles`; false otherwise
 */
function hasRoles(tokenRoles, roles = []) {
  return roles
    .map((r) => tokenRoles.some((t) => t === r))
    .every((x) => x === true);
}

export default {
  namespaced: true,
  state: {
    // In most cases, when this becomes populated, we end up doing a redirect flow,
    // so when we return to the app, it is fresh again and undefined
    redirectUri: undefined,
    showTokenExpiredWarningMSg: false,
    inActiveCheckInterval: null,
    updateTokenInterval: null,
    watchPausable: null,
  },
  getters: {
    authenticated: () => Vue.prototype.$keycloak.authenticated,
    createLoginUrl: () => (options) =>
      Vue.prototype.$keycloak.createLoginUrl(options),
    createLogoutUrl: () => (options) =>
      Vue.prototype.$keycloak.createLogoutUrl(options),
    updateToken: () => (minValidity) =>
      Vue.prototype.$keycloak.updateToken(minValidity),
    clearToken: () => () => Vue.prototype.$keycloak.clearToken(),
    email: () =>
      Vue.prototype.$keycloak.tokenParsed
        ? Vue.prototype.$keycloak.tokenParsed.email
        : '',
    fullName: () => Vue.prototype.$keycloak.fullName,
    hasResourceRoles: (_state, getters) => (resource, roles) => {
      if (!getters.authenticated) return false;
      if (!roles.length) return true; // No roles to check against

      if (getters.resourceAccess && getters.resourceAccess[resource]) {
        return hasRoles(getters.resourceAccess[resource].roles, roles);
      }
      return false; // There are roles to check, but nothing in token to check against
    },
    identityProvider: () =>
      Vue.prototype.$keycloak.tokenParsed
        ? Vue.prototype.$keycloak.tokenParsed.identity_provider
        : null,
    isAdmin: (_state, getters) => getters.hasResourceRoles('chefs', ['admin']),
    isUser: (_state, getters) => getters.hasResourceRoles('chefs', ['user']),
    keycloakReady: () => Vue.prototype.$keycloak.ready,
    keycloakSubject: () => Vue.prototype.$keycloak.subject,
    identityProviderIdentity: () =>
      Vue.prototype.$keycloak.tokenParsed.idp_userid,
    moduleLoaded: () => !!Vue.prototype.$keycloak,
    realmAccess: () => Vue.prototype.$keycloak.tokenParsed.realm_access,
    redirectUri: (state) => state.redirectUri,
    resourceAccess: () => Vue.prototype.$keycloak.tokenParsed.resource_access,
    token: () => Vue.prototype.$keycloak.token,
    tokenParsed: () => Vue.prototype.$keycloak.tokenParsed,
    userName: () => Vue.prototype.$keycloak.userName,
    user: (_state, getters) => {
      const user = {
        username: '',
        firstName: '',
        lastName: '',
        fullName: '',
        email: '',
        idp: 'public',
        public: !getters.authenticated,
      };
      if (getters.authenticated) {
        if (getters.tokenParsed.idp_username) {
          user.username = getters.tokenParsed.idp_username;
        } else {
          user.username = getters.tokenParsed.preferred_username;
        }
        user.firstName = getters.tokenParsed.given_name;
        user.lastName = getters.tokenParsed.family_name;
        user.fullName = getters.tokenParsed.name;
        user.email = getters.tokenParsed.email;
        user.idp = getters.tokenParsed.identity_provider;
      }

      return user;
    },
    showTokenExpiredWarningMSg: (state) => state.showTokenExpiredWarningMSg,
    inActiveCheckInterval: (state) => state.inActiveCheckInterval,
    updateTokenInterval: (state) => state.updateTokenInterval,
  },
  mutations: {
    SET_REDIRECTURI(state, redirectUri) {
      state.redirectUri = redirectUri;
    },
    SET_SHOW_TOKEN_EXPIRED_WARNING_MSG(state, showTokenExpiredWarningMSg) {
      state.showTokenExpiredWarningMSg = showTokenExpiredWarningMSg;
    },
  },
  actions: {
    // TODO: Ideally move this to notifications module, but some strange interactions with lazy loading in unit tests
    errorNavigate(_store, msg) {
      const router = getRouter(Vue.prototype.$config.basePath);
      router.replace({ name: 'Error', params: { msg: msg } });
    },
    alertNavigate(_store, { type, message }) {
      const router = getRouter(Vue.prototype.$config.basePath);
      router.replace({
        name: 'Alert',
        params: { message: message, type: type },
      });
    },
    login({ commit, getters, rootGetters }, idpHint = undefined) {
      if (getters.keycloakReady) {
        // Use existing redirect uri if available
        if (!getters.redirectUri)
          commit('SET_REDIRECTURI', location.toString());

        const options = {
          redirectUri: getters.redirectUri,
        };

        // Determine idpHint based on input or form
        if (idpHint && typeof idpHint === 'string') options.idpHint = idpHint;
        else {
          const { idps } = rootGetters['form/form'];
          if (idps.length) options.idpHint = idps[0];
        }

        if (options.idpHint) {
          // Redirect to Keycloak if idpHint is available
          window.location.replace(getters.createLoginUrl(options));
        } else {
          // Navigate to internal login page if no idpHint specified
          const router = getRouter(Vue.prototype.$config.basePath);
          router.replace({
            name: 'Login',
            params: { idpHint: ['idir', 'bceid-business', 'bceid-basic'] },
          });
        }
      }
    },
    logout({ getters }) {
      if (getters.keycloakReady) {
        window.location.replace(
          getters.createLogoutUrl({
            redirectUri: `${location.origin}/${Vue.prototype.$config.basePath}`,
          })
        );
      }
    },
    async setTokenExpirationWarningDialog(
      { getters, commit, dispatch, state },
      { showTokenExpiredWarningMSg, resetToken }
    ) {
      if (!showTokenExpiredWarningMSg && resetToken) {
        state.watchPausable.resume();
        getters.updateToken(-1).catch(() => {
          getters.clearToken();
          dispatch('logout');
        });
      } else if (!resetToken) {
        clearInterval(getters.updateTokenInterval);
        clearInterval(getters.inActiveCheckInterval);
        dispatch('logout');
      }
      commit('SET_SHOW_TOKEN_EXPIRED_WARNING_MSG', showTokenExpiredWarningMSg);
    },
    async checkTokenExpiration({ getters, dispatch, state }) {
      if (getters.authenticated) {
        const { idle, lastActive } = useIdle(300000, { initialState: true });
        const source = ref(idle);
        const now = useTimestamp({ interval: 1000 });
        state.watchPausable = watchPausable(source, (value) => {
          if (value) {
            clearInterval(getters.updateTokenInterval);
            state.inActiveCheckInterval = setInterval(() => {
              let end = moment(now.value);
              let active = moment(lastActive.value);
              let duration = moment.duration(end.diff(active)).as('minutes');
              if (duration > 10) {
                clearInterval(getters.inActiveCheckInterval);
                state.watchPausable.pause();
                dispatch('setTokenExpirationWarningDialog', {
                  showTokenExpiredWarningMSg: true,
                  resetToken: true,
                });
              }
            }, 1000);
          } else {
            clearInterval(getters.inActiveCheckInterval);
            state.updateTokenInterval = setInterval(() => {
              getters.updateToken(-1).catch(() => {
                getters.clearToken();
              });
            }, 180000);
          }
        });
        state.watchPausable.resume();
      }
    },
  },
};
