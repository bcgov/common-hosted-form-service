const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const stamps = require('../jsonSchema').stamps;

class IdentityProvider extends Timestamps(Model) {
  static get tableName() {
    return 'identity_provider';
  }

  static get idColumn() {
    return 'code';
  }

  static get modifiers() {
    return {
      filterActive(query, value) {
        if (value !== undefined) {
          query.where('active', value);
        }
      },
      orderDefault(builder) {
        builder.orderByRaw('lower("identity_provider"."code")');
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['code', 'display', 'idp'],
      properties: {
        code: { type: 'string', minLength: 1, maxLength: 255 },
        display: { type: 'string', minLength: 1, maxLength: 255 },
        idp: { type: 'string', minLength: 1, maxLength: 255 },
        active: { type: 'boolean' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = IdentityProvider;
