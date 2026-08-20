const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class ScheduledSubmissionDeletion extends Timestamps(Model) {
  static get tableName() {
    return 'scheduled_submission_deletion';
  }

  static get relationMappings() {
    const FormSubmission = require('./formSubmission');
    const Form = require('./form');
    return {
      submission: {
        relation: Model.BelongsToOneRelation,
        modelClass: FormSubmission,
        join: {
          from: 'scheduled_submission_deletion.submissionId',
          to: 'form_submission.id',
        },
      },
      form: {
        relation: Model.BelongsToOneRelation,
        modelClass: Form,
        join: {
          from: 'scheduled_submission_deletion.formId',
          to: 'form.id',
        },
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['submissionId', 'formId', 'eligibleForDeletionAt'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        submissionId: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        eligibleForDeletionAt: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
        failureReason: { type: ['string', 'null'] },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = ScheduledSubmissionDeletion;
