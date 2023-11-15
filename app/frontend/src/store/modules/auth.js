import Vue from 'vue';
import getRouter from '@/router';

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
  },
  getters: {
    authenticated: () => Vue.prototype.$keycloak.authenticated,
    createLoginUrl: () => (options) =>
      Vue.prototype.$keycloak.createLoginUrl(options),
    createLogoutUrl: () => (options) =>
      Vue.prototype.$keycloak.createLogoutUrl(options),
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
  },
  mutations: {
    SET_REDIRECTURI(state, redirectUri) {
      state.redirectUri = redirectUri;
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
  },
};
