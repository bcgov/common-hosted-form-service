const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormSubmission extends Timestamps(Model) {
  static get tableName() {
    return 'form_submission';
  }

  static get modifiers() {
    return {
      filterCreatedBy(query, value) {
        if (value) {
          query.where('createdBy', 'ilike', `%${value}%`);
        }
      },
      filterFormVersionId(query, value) {
        if (value !== undefined) {
          query.where('formVersionId', value);
        }
      },
      orderDescending(builder) {
        builder.orderBy('createdAt', 'desc');
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formVersionId', 'confirmationId', 'submission'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formVersionId: { type: 'string', pattern: Regex.UUID },
        confirmationId: { type: 'string', pattern: Regex.CONFIRMATION_ID },
        draft: { type: 'boolean' },
        deleted: { type: 'boolean' },
        submission: { type: 'object' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormSubmission;
