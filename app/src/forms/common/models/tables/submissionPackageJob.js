const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;
const Status = require('../../../forms/email/submissionPackageJobStatuses');

class SubmissionPackageJob extends Timestamps(Model) {
  static get tableName() {
    return 'submission_package_job';
  }

  static get modifiers() {
    return {
      filterId(query, value) {
        if (value) query.where('id', value);
      },
      filterFormId(query, value) {
        if (value) query.where('formId', value);
      },
      filterSubmissionId(query, value) {
        if (value) query.where('submissionId', value);
      },
      filterStatus(query, value) {
        if (value) query.where('status', value);
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id', 'formId', 'submissionId', 'status'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        submissionId: { type: 'string', pattern: Regex.UUID },
        status: {
          type: 'string',
          enum: Object.values(Status),
        },
        attempts: {
          type: 'integer',
          minimum: 0,
        },
        logs: {
          type: ['string', 'null'],
        },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = SubmissionPackageJob;
