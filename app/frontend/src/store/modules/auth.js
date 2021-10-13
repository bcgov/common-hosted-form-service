import Vue from 'vue';

/**
 * @function hasRoles
 * Checks if all elements in `roles` array exists in `tokenRoles` array
 * @param {string[]} tokenRoles An array of roles that exist in the token
 * @param {string[]} roles An array of roles to check
 * @returns {boolean} True if all `roles` exist in `tokenRoles`; false otherwise
 */
function hasRoles(tokenRoles, roles = []) {
  return roles.map(r => tokenRoles.some(t => t === r)).every(x => x === true);
}

export default {
  namespaced: true,
  state: {},
  getters: {
    authenticated: () => Vue.prototype.$keycloak.authenticated,
    createLoginUrl: () => options => Vue.prototype.$keycloak.createLoginUrl(options),
    createLogoutUrl: () => options => Vue.prototype.$keycloak.createLogoutUrl(options),
    email: () => Vue.prototype.$keycloak.tokenParsed ? Vue.prototype.$keycloak.tokenParsed.email : '',
    fullName: () => Vue.prototype.$keycloak.fullName,
    hasResourceRoles: (_state, getters) => (resource, roles) => {
      if (!getters.authenticated) return false;
      if (!roles.length) return true; // No roles to check against

      if (getters.resourceAccess && getters.resourceAccess[resource]) {
        return hasRoles(getters.resourceAccess[resource].roles, roles);
      }
      return false; // There are roles to check, but nothing in token to check against
    },
    isAdmin: (_state, getters) => getters.hasResourceRoles('chefs', ['admin']),
    isUser: (_state, getters) => getters.hasResourceRoles('chefs', ['user']),
    keycloakReady: () => Vue.prototype.$keycloak.ready,
    keycloakSubject: () => Vue.prototype.$keycloak.subject,
    moduleLoaded: () => !!Vue.prototype.$keycloak,
    realmAccess: () => Vue.prototype.$keycloak.tokenParsed.realm_access,
    resourceAccess: () => Vue.prototype.$keycloak.tokenParsed.resource_access,
    token: () => Vue.prototype.$keycloak.token,
    tokenParsed: () => Vue.prototype.$keycloak.tokenParsed,
    userName: () => Vue.prototype.$keycloak.userName
  },
  mutations: {},
  actions: {
    login({ getters, rootGetters }, idpHint = undefined) {
      if (getters.keycloakReady) {
        const { idps } = rootGetters['form/form'];
        const options = {};
        // Determine idpHint based on input or form
        if (idpHint && typeof idpHint === 'string') options.idpHint = idpHint;
        else if (idps.length) options.idpHint = idps[0];

        if (options.idpHint) {
          // Redirect to Keycloak if idpHint is available
          window.location.replace(getters.createLoginUrl(options));
        } else {
          // Navigate to internal login page if no idpHint specified
          const basePath = Vue.prototype.$config.basePath;
          window.location.replace(`${basePath}/login`);
        }
      }
    },
    logout({ getters }) {
      if (getters.keycloakReady) {
        window.location.replace(
          getters.createLogoutUrl({
            redirectUri: `${location.origin}/${Vue.prototype.$config.basePath}`
          })
        );
      }
    }
  }
};
