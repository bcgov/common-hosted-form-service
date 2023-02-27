const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class SubmissionToCSVStorage extends Timestamps(Model) {
  static get tableName() {
    return 'submission_to_csv_storage';
  }


  static get modifiers() {
    return {
      orderDescending(builder) {
        builder.orderBy('createdAt', 'desc');
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        userId:{ type: 'string', pattern: Regex.UUID },
        version: { type: 'integer' },
        formId: { type: 'string', pattern: Regex.UUID },
        file: { type: 'object' },
        ready: { type: 'boolean' },
        ...stamps
      },
      additionalProperties: false
    };
  }
}

module.exports = SubmissionToCSVStorage;