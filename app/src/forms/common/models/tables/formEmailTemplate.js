const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormEmailTemplate extends Timestamps(Model) {
  static get tableName() {
    return 'form_email_template';
  }

  static get modifiers() {
    return {
      filterId(query, value) {
        if (value) {
          query.where('id', value);
        }
      },
      filterFormId(query, value) {
        if (value) {
          query.where('formId', value);
        }
      },
      filterType(query, value) {
        if (value) {
          query.where('type', value);
        }
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['body', 'formId', 'subject', 'title', 'type'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        type: { type: 'string' },
        subject: { type: 'string' },
        title: { type: 'string' },
        body: { type: 'string' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormEmailTemplate;
