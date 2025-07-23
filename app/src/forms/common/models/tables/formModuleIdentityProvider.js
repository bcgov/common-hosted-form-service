const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormModuleIdentityProvider extends Timestamps(Model) {
  static get tableName() {
    return 'form_module_identity_provider';
  }

  static get modifiers() {
    return {
      filterFormModuleId(query, value) {
        if (value !== undefined) {
          query.where('formModuleId', value);
        }
      },
      filterCode(query, value) {
        if (value) {
          // ilike is postgres case insensitive like
          query.where('code', 'ilike', `%${value}%`);
        }
      },
      orderDefault(builder) {
        builder.orderByRaw('lower("code")');
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formModuleId', 'code'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formModuleId: { type: 'string', pattern: Regex.UUID },
        code: { type: 'string', minLength: 1, maxLength: 255 },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormModuleIdentityProvider;
