import { defineStore } from 'pinia';
import getRouter from '~/router';
import { useIdpStore } from '~/store/identityProviders';
import { useAppStore } from '~/store/app';
import { useTenantStore } from '~/store/tenant';
import { rbacService } from '../services';

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

const defaultUser = {
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
  public: true,
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    keycloak: undefined,
    redirectUri: undefined,
    ready: false,
    authenticated: false,
    logoutUrl: undefined,
    currentUser: defaultUser,
  }),
  getters: {
    createLogoutUrl: (state) => (options) =>
      state.keycloak.createLogoutUrl(options),
    email: (state) => state.currentUser?.email,
    fullName: (state) => state.currentUser?.fullName,
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
      return state.currentUser;
    },
  },
  actions: {
    async createLoginUrl(options) {
      return await this.keycloak.createLoginUrl(options);
    },
    updateKeycloak(keycloak, isAuthenticated) {
      this.keycloak = keycloak;
      this.authenticated = isAuthenticated;
      if (this.authenticated) {
        rbacService
          .getCurrentUser()
          .then((response) => {
            const user = response.data;
            const idpStore = useIdpStore();
            const idpObject = idpStore.findByCode(user.idp);
            // only populate these specific attributes.
            this.currentUser = {
              idpUserId: user.idpUserId,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              fullName: user.fullName,
              email: user.email,
              idp: idpObject,
              public: user.public,
            };
          })
          .catch(() => {
            this.currentUser = defaultUser;
          });
      } else {
        this.currentUser = defaultUser;
        // Reset tenant store on logout
        const tenantStore = useTenantStore();
        tenantStore.resetTenant();
      }
    },
    async login(idpHint) {
      if (!this.ready) return;

      if (!this.redirectUri) this.redirectUri = location.toString();

      const options = {
        redirectUri: this.redirectUri,
        idpHint: this.resolveIdpHint(idpHint),
      };

      if (options.idpHint) {
        // Redirect to Keycloak if idpHint is available
        window.location.replace(await this.createLoginUrl(options));
        return;
      }

      // Navigate to internal login page with a selection of hints
      this.navigateToLogin(idpHint);
    },

    resolveIdpHint(idpHint) {
      if (idpHint && typeof idpHint === 'string') return idpHint;
      if (idpHint && Array.isArray(idpHint) && idpHint.length === 1)
        return idpHint[0];
      return undefined;
    },

    navigateToLogin(idpHint) {
      const router = getRouter();
      const idpStore = useIdpStore();
      let hints = idpStore.loginIdpHints;
      if (idpHint && Array.isArray(idpHint)) {
        hints = idpHint;
      }
      router.replace({
        name: 'Login',
        query: { idpHint: hints },
      });
    },
    logout() {
      if (this.ready) {
        // Clear tenant selection before logging out
        const tenantStore = useTenantStore();
        tenantStore.resetTenant();

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
