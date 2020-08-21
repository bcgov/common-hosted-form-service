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
    fullName: () => Vue.prototype.$keycloak.fullName,
    hasResourceRoles: (_state, getters) => (resource, roles) => {
      if (!getters.authenticated) return false;
      if (!roles.length) return true; // No roles to check against

      if (getters.resourceAccess[resource]) {
        return hasRoles(getters.resourceAccess[resource].roles, roles);
      }
      return false; // There are roles to check, but nothing in token to check against
    },
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
  actions: {}
};
