const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormApiKey extends Timestamps(Model) {
  static get tableName() {
    return 'form_api_key';
  }

  static get modifiers() {
    return {
      filterFormId(query, value) {
        if (value) {
          query.where('formId', value);
        }
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId'],
      properties: {
        id: { type: 'integer' },
        formId: { type: 'string', pattern: Regex.UUID },
        secret: { type: 'string', pattern: Regex.UUID },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormApiKey;
