const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class DocumentTemplate extends Timestamps(Model) {
  static get tableName() {
    return 'document_template';
  }

  static get modifiers() {
    return {
      filterActive(query, value) {
        if (value) {
          query.where('active', value);
        }
      },
      filterFormId(query, value) {
        if (value) {
          query.where('formId', value);
        }
      },
      filterId(query, value) {
        if (value) {
          query.where('id', value);
        }
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['filename', 'formId', 'template'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        active: { type: 'boolean' },
        filename: { type: 'string' },
        template: { type: 'string' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = DocumentTemplate;
