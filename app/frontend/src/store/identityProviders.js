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
              code: p.code,
              display: p.display,
              hint: p.idp,
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
            result.push(p.idp);
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
    isValidIdpHint(hint) {
      if (hint && this.providers) {
        return this.providers.findIndex((x) => x.idp === hint) > -1;
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
          (x) => x.code === code && x.extra?.addTeamMemberSearch
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
    findByCode(code) {
      if (code && this.providers) {
        const idp = this.providers.find((x) => x.code === code);
        if (idp) {
          return {
            code: idp.code,
            display: idp.display,
            hint: idp.idp,
          };
        }
      }
      return undefined;
    },
    findByHint(hint) {
      if (hint && this.providers) {
        const idp = this.providers.find((x) => x.idp === hint);
        if (idp) {
          return {
            code: idp.code,
            display: idp.display,
            hint: idp.idp,
          };
        }
      }
      return undefined;
    },
    getTokenMapValue(hint, field, token) {
      if (hint && this.providers) {
        const idp = this.providers.find((x) => x.idp === hint);
        if (idp) {
          // now find this field...
          const tokenKey = idp.tokenmap[field];
          if (tokenKey) {
            return token[tokenKey];
          }
        }
      }
      return undefined;
    },
  },
});
