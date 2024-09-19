const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class User extends Timestamps(Model) {
  static get tableName() {
    return 'user';
  }

  static get relationMappings() {
    const IdentityProvider = require('./identityProvider');

    return {
      identityProvider: {
        relation: Model.BelongsToOneRelation,
        modelClass: IdentityProvider,
        join: {
          from: 'user.idpCode',
          to: 'identity_provider.code',
        },
      },
    };
  }

  static get modifiers() {
    return {
      filterIdpUserId(query, value) {
        if (value) {
          query.where('idpUserId', value);
        }
      },
      filterKeycloakId(query, value) {
        if (value) {
          query.where('keycloakId', value);
        }
      },
      filterIdpCode(query, value) {
        if (value) {
          query.where('idpCode', value);
        }
      },
      filterUsername(query, value, exact = false, caseSensitive = true) {
        if (value) {
          if (exact && caseSensitive) query.where('username', value);
          // ilike is postgres case insensitive like
          else if (exact && !caseSensitive) query.where('username', 'ilike', value);
          else if (!exact && caseSensitive) query.where('username', 'like', `%${value}%`);
          else query.where('username', 'ilike', `%${value}%`);
        }
      },
      filterFirstName(query, value) {
        if (value) {
          // ilike is postgres case insensitive like
          query.where('firstName', 'ilike', `%${value}%`);
        }
      },
      filterLastName(query, value) {
        if (value) {
          // ilike is postgres case insensitive like
          query.where('lastName', 'ilike', `%${value}%`);
        }
      },
      filterFullName(query, value) {
        if (value) {
          // ilike is postgres case insensitive like
          query.where('fullName', 'ilike', `%${value}%`);
        }
      },
      filterEmail(query, value, exact = false, caseSensitive = true) {
        if (value) {
          if (exact && caseSensitive) query.where('email', value);
          // ilike is postgres case insensitive like
          else if (exact && !caseSensitive) query.where('email', 'ilike', value);
          else if (!exact && caseSensitive) query.where('email', 'like', `%${value}%`);
          else query.where('email', 'ilike', `%${value}%`);
        }
      },
      filterSearch(query, value) {
        // use this field 'search' to OR across many fields
        // must be written as subquery function to force parentheses grouping
        if (value) {
          query.where((subquery) => {
            subquery.where('username', 'ilike', `%${value}%`).orWhere('fullName', 'ilike', `%${value}%`).orWhere('email', 'ilike', `%${value}%`);
          });
        }
      },
      safeSelect(query) {
        query.select('id', 'idpUserId', 'keycloakId', 'idpCode');
      },
      orderLastFirstAscending(builder) {
        builder.orderByRaw('lower("lastName"), lower("firstName")');
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['keycloakId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        idpUserId: { type: 'string', maxLength: 255 },
        keycloakId: { type: 'string', maxLength: 255 },
        username: { type: ['string', 'null'], maxLength: 255 },
        firstName: { type: ['string', 'null'], maxLength: 255 },
        lastName: { type: ['string', 'null'], maxLength: 255 },
        fullName: { type: ['string', 'null'], maxLength: 255 },
        email: { type: ['string', 'null'], maxLength: 255 },
        idpCode: { type: ['string', 'null'], maxLength: 255 },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = User;
