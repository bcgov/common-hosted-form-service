const errorToProblem = require('./errorToProblem');
const { IdentityProvider, User } = require('../forms/common/models');

const SERVICE = 'IdpService';

const IDP_KEY = 'identity_provider';

function stringToGUID(s) {
  const regex = /^([0-9a-fA-F]{8})([0-9a-fA-F]{4})([0-9a-fA-F]{4})([0-9a-fA-F]{4})([0-9a-fA-F]{12})/;
  const m = s.replace(/-+/g, '').match(regex);
  return m ? `${m[1]}-${m[2]}-${m[3]}-${m[4]}-${m[5]}` : null;
}

function getNestedObject(obj, key) {
  return key.split('.').reduce(function (o, x) {
    return typeof o == 'undefined' || o === null ? o : o[x];
  }, obj);
}

function parseJsonField(attributeName, searchpath, token) {
  let value = null;
  for (const k of Object.keys(token)) {
    if (k === attributeName) {
      const obj = JSON.parse(token[k]);
      value = getNestedObject(obj, searchpath);
    }
  }
  return value;
}

function isEmpty(s) {
  return s === undefined || s === null || (s && s.trim() === '');
}

function isNotEmpty(s) {
  return !isEmpty(s);
}

class IdpService {
  constructor() {
    this.providers = null;
    this.activeProviders = null;
  }

  // this should be called by the UX on load, so it should be initialized
  async getIdentityProviders(active) {
    if (!this.providers) {
      this.providers = await IdentityProvider.query().modify('orderDefault');
      this.activeProviders = this.providers.filter((x) => x.active);
    }
    return active ? this.activeProviders : this.providers;
  }

  async findByIdp(idp) {
    const p = await this.getIdentityProviders(true);
    return p.find((x) => x.idp === idp);
  }

  async findByCode(code) {
    const p = await this.getIdentityProviders(true);
    return p.find((x) => x.code === code);
  }

  async getValue(key, tokenKey, token) {
    let tokenValue = null;
    // examine the key, it may contain parsing information
    // if key contains `::`, then we have parsing method to call.
    if (tokenKey.includes('::')) {
      // determine which convert method...
      const k_fn = tokenKey.split('::'); //split to key and function
      const tv = token[k_fn[0]]; //token value
      const fn = k_fn[1]; //function name
      switch (fn) {
        case 'stringToGUID':
          tokenValue = stringToGUID(tv);
          if (!tokenValue) {
            throw new Error(`Value in token for '${tv}' cannot be converted to GUID.`);
          }
          break;
        case 'parseJsonField':
          try {
            // k_fn[0] is [attribute name ,  json search path]
            tokenValue = parseJsonField(k_fn[0].split(',')[0], k_fn[0].split(',')[1], token);
          } catch (error) {
            throw new Error(`Value in token mapped to '${key}' cannot be converted from JSON.`);
          }
          break;
        default:
          throw new Error(`Value in token mapped to '${key}' specified unknown parsing routine: ${fn}.`);
      }
    } else {
      tokenValue = token[tokenKey];
    }
    // errors if no value???
    return tokenValue;
  }

  // given a token, determine idp and transform
  async parseToken(token) {
    try {
      let userInfo = {
        idpUserId: undefined,
        keycloakId: undefined,
        username: 'public',
        firstName: undefined,
        lastName: undefined,
        fullName: 'public',
        email: undefined,
        idp: 'public',
        public: true,
      };
      if (token) {
        // token needs `identity_provider` field
        if (IDP_KEY in token) {
          // can we find the idp?
          const idp = await this.findByIdp(token[IDP_KEY]);
          if (idp) {
            // now do the mapping...
            for (const key of Object.keys(userInfo)) {
              const tokenKey = idp.tokenmap[key];
              if (tokenKey) {
                userInfo[key] = await this.getValue(key, tokenKey, token);
              }
            }
            userInfo.public = false;
          } else {
            throw new Error(`Cannot find configuration for Identity Provider: '${token[IDP_KEY]}'.`);
          }
        } else {
          throw new Error(`Token does not have an '${IDP_KEY}' value. Cannot parse token.`);
        }
      }
      return userInfo;
    } catch (e) {
      errorToProblem(SERVICE, e);
    }
  }

  async userSearch(params) {
    // check the idpCode, set up User query accordingly.
    if (params && params.idpCode) {
      const idp = await this.findByCode(params.idpCode);
      if (idp && idp.extra?.userSearch) {
        // ok, this idp has specific requirements of user search...
        const q = User.query();

        // find all the different groupings for required.
        //   0 : not required
        //   1 : required
        // > 1 : params are grouped by number, one of each group is required.

        const requiredTypes = Array.from(new Set(idp.extra.userSearch.filters.map((x) => x.required)));
        let valid = false;
        for (const reqd of requiredTypes) {
          const filters = idp.extra.userSearch.filters.filter((x) => x.required === reqd);
          let groupValid = reqd === 1 ? true : false;
          for (const f of filters) {
            // add the filter to the query...
            this.applyUserSearchFilters(f, params, q);
            //
            // ok, check for required...
            //
            const value = params[f.param];
            if (reqd < 1) {
              // if required < 1, do nothing, always valid
              groupValid = true;
            } else if (reqd === 1 && isEmpty(value)) {
              // if required = 1, all filters in this group are required.
              groupValid = false;
            } else {
              // only one of the filters in this group is required.
              if (isNotEmpty(value)) {
                groupValid = true;
              }
            }
          }
          valid = groupValid ? true : false;
        }
        // ok, if not valid then we want to throw an error
        if (!valid) {
          throw new Error(idp.extra.userSearch.detail);
        }
        // guess we are good, return the customized user search.
        return q.modify('orderLastFirstAscending');
      }
    }

    // ok, no error thown, no specific search requirements...
    // so here is the default user search.
    return User.query()
      .modify('filterIdpUserId', params.idpUserId)
      .modify('filterIdpCode', params.idpCode)
      .modify('filterUsername', params.username, false, false)
      .modify('filterFullName', params.fullName)
      .modify('filterFirstName', params.firstName)
      .modify('filterLastName', params.lastName)
      .modify('filterEmail', params.email, false, false)
      .modify('filterSearch', params.search)
      .modify('orderLastFirstAscending');
  }

  applyUserSearchFilters(filter, params, query) {
    const filterName = filter.name;
    const paramName = filter.param;
    const value = params[paramName];
    let exact = 'exact' in filter ? filter.exact : false;
    let caseSensitive = 'caseSensitive' in filter ? filter.caseSensitive : true;
    if (exact || caseSensitive) {
      query.modify(filterName, value, exact, caseSensitive);
    } else {
      query.modify(filterName, value);
    }
    return value;
  }
}

let idpService = new IdpService();
module.exports = idpService;
