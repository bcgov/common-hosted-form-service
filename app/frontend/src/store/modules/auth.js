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

const createStore = (app) => {
  return {
    namespaced: true,
    state: {
      // In most cases, when this becomes populated, we end up doing a redirect flow,
      // so when we return to the app, it is fresh again and undefined
      redirectUri: undefined,
    },
    getters: {
      authenticated: () => app.config.globalProperties.$keycloak.authenticated,
      createLoginUrl: () => (options) =>
        app.config.globalProperties.$keycloak.createLoginUrl(options),
      createLogoutUrl: () => (options) =>
        app.config.globalProperties.$keycloak.createLogoutUrl(options),
      email: () =>
        app.config.globalProperties.$keycloak.tokenParsed
          ? app.config.globalProperties.$keycloak.tokenParsed.email
          : '',
      fullName: () => app.config.globalProperties.$keycloak.fullName,
      hasResourceRoles: (_state, getters) => (resource, roles) => {
        if (!getters.authenticated) return false;
        if (!roles.length) return true; // No roles to check against

        if (getters.resourceAccess && getters.resourceAccess[resource]) {
          return hasRoles(getters.resourceAccess[resource].roles, roles);
        }
        return false; // There are roles to check, but nothing in token to check against
      },
      identityProvider: () =>
        app.config.globalProperties.$keycloak.tokenParsed
          ? app.config.globalProperties.$keycloak.tokenParsed.identity_provider
          : null,
      isAdmin: (_state, getters) =>
        getters.hasResourceRoles('chefs', ['admin']),
      isUser: (_state, getters) => getters.hasResourceRoles('chefs', ['user']),
      keycloakReady: () => app.config.globalProperties.$keycloak.ready,
      keycloakSubject: () => app.config.globalProperties.$keycloak.subject,
      identityProviderIdentity: () =>
        app.config.globalProperties.$keycloak.tokenParsed.idp_userid,
      moduleLoaded: () => !!app.config.globalProperties.$keycloak,
      realmAccess: () =>
        app.config.globalProperties.$keycloak.tokenParsed.realm_access,
      redirectUri: (state) => state.redirectUri,
      resourceAccess: () =>
        app.config.globalProperties.$keycloak.tokenParsed.resource_access,
      token: () => app.config.globalProperties.$keycloak.token,
      tokenParsed: () => app.config.globalProperties.$keycloak.tokenParsed,
      userName: () => app.config.globalProperties.$keycloak.userName,
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
        const router = getRouter(app.config.globalProperties.$config.basePath);
        router.replace({ name: 'Error', params: { msg: msg } });
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
            const router = getRouter(
              app.config.globalProperties.$config.basePath
            );
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
              redirectUri: `${location.origin}/${app.config.globalProperties.$config.basePath}`,
            })
          );
        }
      },
    },
  };
};

export default (app) => createStore(app);

/* export default {
  namespaced: true,
  state: {
    // In most cases, when this becomes populated, we end up doing a redirect flow,
    // so when we return to the app, it is fresh again and undefined
    redirectUri: undefined,
  },
  getters: {
    authenticated: () =>
      app.config.globalProperties.$keycloak.authenticated,
    createLoginUrl: () => (options) =>
      app.config.globalProperties.$keycloak.createLoginUrl(
        options
      ),
    createLogoutUrl: () => (options) =>
      app.config.globalProperties.$keycloak.createLogoutUrl(
        options
      ),
    email: () =>
      app.config.globalProperties.$keycloak.tokenParsed
        ? app.config.globalProperties.$keycloak.tokenParsed
            .email
        : '',
    fullName: () =>
      app.config.globalProperties.$keycloak.fullName,
    hasResourceRoles: (_state, getters) => (resource, roles) => {
      if (!getters.authenticated) return false;
      if (!roles.length) return true; // No roles to check against

      if (getters.resourceAccess && getters.resourceAccess[resource]) {
        return hasRoles(getters.resourceAccess[resource].roles, roles);
      }
      return false; // There are roles to check, but nothing in token to check against
    },
    identityProvider: () =>
      app.config.globalProperties.$keycloak.tokenParsed
        ? app.config.globalProperties.$keycloak.tokenParsed
            .identity_provider
        : null,
    isAdmin: (_state, getters) => getters.hasResourceRoles('chefs', ['admin']),
    isUser: (_state, getters) => getters.hasResourceRoles('chefs', ['user']),
    keycloakReady: () =>
      app.config.globalProperties.$keycloak.ready,
    keycloakSubject: () =>
      app.config.globalProperties.$keycloak.subject,
    identityProviderIdentity: () =>
      app.config.globalProperties.$keycloak.tokenParsed
        .idp_userid,
    moduleLoaded: () =>
      !!app.config.globalProperties.$keycloak,
    realmAccess: () =>
      app.config.globalProperties.$keycloak.tokenParsed
        .realm_access,
    redirectUri: (state) => state.redirectUri,
    resourceAccess: () =>
      app.config.globalProperties.$keycloak.tokenParsed
        .resource_access,
    token: () => app.config.globalProperties.$keycloak.token,
    tokenParsed: () =>
      app.config.globalProperties.$keycloak.tokenParsed,
    userName: () =>
      app.config.globalProperties.$keycloak.userName,
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
      const router = getRouter(
        app.config.globalProperties.$config.basePath
      );
      router.replace({ name: 'Error', params: { msg: msg } });
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
          const router = getRouter(
            app.config.globalProperties.$config.basePath
          );
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
            redirectUri: `${location.origin}/${
              app.config.globalProperties.$config.basePath
            }`,
          })
        );
      }
    },
  },
};
 */
