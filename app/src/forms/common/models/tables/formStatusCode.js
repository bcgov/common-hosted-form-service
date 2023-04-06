const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormStatusCode extends Timestamps(Model) {
  static get tableName() {
    return 'form_status_code';
  }

  static get relationMappings() {
    const StatusCode = require('./statusCode');

    return {
      statusCode: {
        relation: Model.HasOneRelation,
        modelClass: StatusCode,
        join: {
          from: 'form_status_code.code',
          to: 'status_code.code',
        },
      },
    };
  }

  static get modifiers() {
    return {
      filterFormId(query, value) {
        if (value !== undefined) {
          query.where('formId', value);
        }
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId', 'code'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        code: { type: 'string' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormStatusCode;
