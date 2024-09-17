const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormSubmissionStatus extends Timestamps(Model) {
  static get tableName() {
    return 'form_submission_status';
  }

  static get relationMappings() {
    const User = require('./user');

    return {
      user: {
        relation: Model.HasOneRelation,
        modelClass: User,
        join: {
          from: 'form_submission_status.assignedToUserId',
          to: 'user.id',
        },
      },
    };
  }

  static get modifiers() {
    return {
      filterSubmissionId(query, value) {
        if (value !== undefined) {
          query.where('submissionId', value);
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
      required: ['submissionId', 'code'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        submissionId: { type: 'string', pattern: Regex.UUID },
        code: { type: 'string' },
        assignedToUserId: { type: 'string', pattern: Regex.UUID },
        actionDate: { type: 'string' },
        emailRecipients: { type: ['array', 'null'], items: { type: 'string', pattern: Regex.EMAIL } },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormSubmissionStatus;
