import { defineStore } from 'pinia';

export const useIdpStore = defineStore('idps', {
  state: () => ({
    providers: null,
  }),
  getters: {
    loginButtons: (state) => {
      const result = [];
      if (state.providers) {
        for (const p of state.providers) {
          if (p.login) {
            result.push({
              label: p.display,
              type: p.code,
            });
          }
        }
      }
      return result;
    },
    loginIdpHints: (state) => {
      const result = [];
      if (state.providers) {
        for (const p of state.providers) {
          if (p.login) {
            result.push(p.code);
          }
        }
      }
      return result;
    },
    primaryIdp: (state) => {
      let result = null;
      if (state.providers) {
        result = state.providers.find((x) => x.primary);
      }
      return result;
    },
  },
  actions: {
    isPrimary(code) {
      if (code && this.providers) {
        return (
          this.providers.findIndex((x) => x.code === code && x.primary) > -1
        );
      }
      return false;
    },
    isValidIdp(code) {
      if (code && this.providers) {
        return this.providers.findIndex((x) => x.code === code) > -1;
      }
      return false;
    },
    hasFormAccessSettings(code, accessSettingsType) {
      let result = false;
      if (code && accessSettingsType && this.providers) {
        const idp = this.providers.find((x) => x.code === code);
        if (idp) {
          result = idp.extra?.formAccessSettings === accessSettingsType;
        }
      }
      return result;
    },
    teamMembershipSearch(code) {
      if (code && this.providers) {
        const idp = this.providers.find(
          (x) => x.code === code && idp.extra?.addTeamMemberSearch
        );
        return idp ? idp.extra?.addTeamMemberSearch : null;
      }
      return null;
    },
    hasPermission(code, permission) {
      let result = false;
      if (code && permission && this.providers) {
        const idp = this.providers.find((x) => x.code === code);
        if (idp) {
          result = idp.permissions.includes(permission);
        }
      }
      return result;
    },
    listPermissions(code) {
      if (code && this.providers) {
        const idp = this.providers.find((x) => x.code === code);
        if (idp) {
          return idp.permissions;
        }
      }
      return undefined;
    },
    hasRole(code, role) {
      let result = false;
      if (code && role && this.providers) {
        const idp = this.providers.find((x) => x.code === code);
        if (idp) {
          result = idp.roles.includes(role);
        }
      }
      return result;
    },
    listRoles(code) {
      if (code && this.providers) {
        const idp = this.providers.find((x) => x.code === code);
        if (idp) {
          return idp.roles;
        }
      }
      return undefined;
    },
  },
});
