const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormIdentityProvider extends Timestamps(Model) {
  static get tableName() {
    return 'form_identity_provider';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        code: { type: 'string', maxLength: 255 },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormIdentityProvider;
