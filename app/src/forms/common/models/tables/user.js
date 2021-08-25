const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class User extends Timestamps(Model) {
  static get tableName() {
    return 'user';
  }

  static get modifiers() {
    return {
      filterKeycloakId(query, value) {
        if (value) {
          query.where('keycloakId', value);
        }
      },
      filterUsername(query, value) {
        if (value) {
          // ilike is postgres case insensitive like
          query.where('username', 'ilike', `%${value}%`);
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
      filterEmail(query, value) {
        if (value) {
          // ilike is postgres case insensitive like
          query.where('email', 'ilike', `%${value}%`);
        }
      },
      filterSearch(query, value) {
        // use this field 'search' to OR across many fields
        if (value) {
          query.where('username', 'ilike', `%${value}%`)
            .orWhere('fullName', 'ilike', `%${value}%`)
            .orWhere('email', 'ilike', `%${value}%`);
        }
      },
      orderLastFirstAscending(builder) {
        builder.orderByRaw('lower("lastName"), lower("firstName")');
      }
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['keycloakId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        keycloakId: { type: 'string', pattern: Regex.UUID },
        username: { type: ['string', 'null'], maxLength: 255 },
        firstName: { type: ['string', 'null'], maxLength: 255 },
        lastName: { type: ['string', 'null'], maxLength: 255 },
        fullName: { type: ['string', 'null'], maxLength: 255 },
        email: { type: ['string', 'null'], maxLength: 255 },
        ...stamps
      },
      additionalProperties: false
    };
  }
}

module.exports = User;
