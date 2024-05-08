import { defineStore } from 'pinia';
import getRouter from '~/router';
import { useIdpStore } from '~/store/identityProviders';
import { useAppStore } from '~/store/app';

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

export const useAuthStore = defineStore('auth', {
  state: () => ({
    keycloak: undefined,
    redirectUri: undefined,
    ready: false,
    authenticated: false,
    logoutUrl: undefined,
  }),
  getters: {
    createLoginUrl: (state) => (options) =>
      state.keycloak.createLoginUrl(options),
    createLogoutUrl: (state) => (options) =>
      state.keycloak.createLogoutUrl(options),
    email: (state) =>
      state.keycloak.tokenParsed ? state.keycloak.tokenParsed.email : '',
    fullName: (state) => state.keycloak.tokenParsed.name,
    /**
     * Checks if the state has the required resource roles
     * @returns (T/F) Whether the state has the required roles
     */
    hasResourceRoles: (state) => {
      return (roles) => {
        if (!state.authenticated) return false;
        if (!roles.length) return true; // No roles to check against

        if (state.resourceAccess) {
          return hasRoles(state.resourceAccess, roles);
        }
        return false; // There are roles to check, but nothing in token to check against
      };
    },
    identityProvider: (state) => {
      const idpStore = useIdpStore();
      return state.keycloak.tokenParsed
        ? idpStore.findByHint(state.tokenParsed.identity_provider)
        : null;
    },
    isAdmin: (state) => state.hasResourceRoles(['admin']),
    keycloakSubject: (state) => state.keycloak.subject,
    identityProviderIdentity: (state) => {
      // leaving this for backwards compatibility.
      // please call user.idpUserId instead
      const idpStore = useIdpStore();
      return idpStore.getTokenMapValue(
        state.tokenParsed.identity_provider,
        'idpUserId',
        state.tokenParsed
      );
    },
    moduleLoaded: (state) => !!state.keycloak,
    realmAccess: (state) => state.keycloak.tokenParsed.realm_access,
    resourceAccess: (state) => state.keycloak.tokenParsed.client_roles,
    token: (state) => state.keycloak.token,
    tokenParsed: (state) => state.keycloak.tokenParsed,
    userName: (state) => state.keycloak.tokenParsed.preferred_username,
    user: (state) => {
      const idpStore = useIdpStore();
      const user = {
        idpUserId: '',
        username: '',
        firstName: '',
        lastName: '',
        fullName: '',
        email: '',
        idp: {
          code: 'public',
          display: 'Public',
          hint: 'public',
        },
        public: !state.authenticated,
      };
      if (state.authenticated) {
        user.firstName = state.tokenParsed.given_name;
        user.lastName = state.tokenParsed.family_name;
        user.fullName = state.tokenParsed.name;
        user.email = state.tokenParsed.email;
        const idp = idpStore.findByHint(state.tokenParsed.identity_provider);
        user.idp = idp;
        user.username = idpStore.getTokenMapValue(
          state.tokenParsed.identity_provider,
          'username',
          state.tokenParsed
        );
        user.idpUserId = idpStore.getTokenMapValue(
          state.tokenParsed.identity_provider,
          'idpUserId',
          state.tokenParsed
        );
        if (!user.username) {
          user.username = state.tokenParsed.preferred_username;
        }
      }

      return user;
    },
  },
  actions: {
    updateKeycloak(keycloak, isAuthenticated) {
      this.keycloak = keycloak;
      this.authenticated = isAuthenticated;
    },
    login(idpHint) {
      if (this.ready) {
        if (!this.redirectUri) this.redirectUri = location.toString();

        const options = {
          redirectUri: this.redirectUri,
        };

        // Determine idpHint based on input or form
        if (idpHint && typeof idpHint === 'string') options.idpHint = idpHint;

        if (options.idpHint) {
          // Redirect to Keycloak if idpHint is available
          window.location.replace(this.createLoginUrl(options));
        } else {
          // Navigate to internal login page if no idpHint specified
          const router = getRouter();
          const idpStore = useIdpStore();
          router.replace({
            name: 'Login',
            query: { idpHint: idpStore.loginIdpHints },
          });
        }
      }
    },
    logout() {
      if (this.ready) {
        // if we have not specified a logoutUrl, then use default
        if (!this.logoutUrl) {
          window.location.replace(
            this.createLogoutUrl({
              redirectUri: location.origin,
            })
          );
        } else {
          const appStore = useAppStore();
          const cli_param = `client_id=${this.keycloak.clientId}`;
          const redirect_param = `post_logout_redirect_uri=${location.origin}${appStore.config.basePath}`;
          const logout_param = `${redirect_param}&${cli_param}`;
          let logout = `${this.logoutUrl}?${encodeURIComponent(logout_param)}`;
          window.location.assign(logout);
        }
      }
    },
  },
});
