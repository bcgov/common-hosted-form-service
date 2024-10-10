const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormMetadata extends Timestamps(Model) {
  static get tableName() {
    return 'form_metadata';
  }

  static get modifiers() {
    return {
      filterFormId(query, value) {
        if (value) {
          query.where('formId', value);
        }
      },
      findByIdAndFormId(query, id, formId) {
        if (id !== undefined && formId !== undefined) {
          query.where('id', id).where('formId', formId);
        }
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        metadata: { type: 'object' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormMetadata;
