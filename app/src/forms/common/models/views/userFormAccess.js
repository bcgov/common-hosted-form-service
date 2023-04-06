const { Model } = require('objection');

const utils = require('../utils');

class UserFormAccess extends Model {
  static get tableName() {
    return 'user_form_access_vw';
  }

  static get modifiers() {
    return {
      filterUserId(query, value) {
        if (value) {
          query.where('userId', value);
        }
      },
      filterIdpUserId(query, value) {
        if (value) {
          query.where('idpUserId', value);
        }
      },
      filterUsername(query, value) {
        if (value) {
          query.where('username', 'ilike', `%${value}%`);
        }
      },
      filterFullName(query, value) {
        if (value) {
          query.where('fullName', 'ilike', `%${value}%`);
        }
      },
      filterFirstName(query, value) {
        if (value) {
          query.where('firstName', 'ilike', `%${value}%`);
        }
      },
      filterLastName(query, value) {
        if (value) {
          query.where('lastName', 'ilike', `%${value}%`);
        }
      },
      filterEmail(query, value) {
        if (value) {
          query.where('email', 'ilike', `%${value}%`);
        }
      },
      filterFormId(query, value) {
        if (value) {
          query.where('formId', value);
        }
      },
      filterFormName(query, value) {
        if (value) {
          query.where('formName', 'ilike', `%${value}%`);
        }
      },
      filterActive(query, value) {
        if (value !== undefined) {
          query.where('active', value);
        }
      },
      filterByAccess(query, idps, roles, permissions) {
        if (idps || roles || permissions) {
          const _idps = utils.toArray(idps);
          const _roles = utils.toArray(roles);
          const _permissions = utils.toArray(permissions);
          let clauses = [];

          if (_idps.length) {
            if (_idps.length === 1 && _idps[0] === '*') {
              clauses.push('(\'{}\'::varchar[] = "roles" and array_length("idps", 1) > 0)');
            } else {
              clauses.push(`('{}'::varchar[] = "roles" and (${utils.inArrayClause('idps', _idps)}))`);
            }
          }

          if (_roles.length) {
            if (_roles.length === 1 && _roles[0] === '*') {
              clauses.push('array_length("roles", 1) > 0');
            } else {
              clauses.push(utils.inArrayFilter('roles', _roles));
            }
          }

          if (_permissions.length) {
            if (_permissions.length === 1 && _permissions[0] === '*') {
              clauses.push('array_length("permissions", 1) > 0');
            } else {
              clauses.push(utils.inArrayFilter('permissions', _permissions));
            }
          }

          if (clauses.length) {
            query.whereRaw(`(${clauses.join(' or ')})`);
          }
        }
      },
      orderFormNameAscending(builder) {
        builder.orderByRaw('lower("formName")');
      },
      orderLastFirstAscending(builder) {
        builder.orderByRaw('lower("lastName"), lower("firstName")');
      },
      orderDefault(builder) {
        builder.orderByRaw('lower("lastName"), lower("firstName"), lower("formName")');
      },
    };
  }
}

module.exports = UserFormAccess;
