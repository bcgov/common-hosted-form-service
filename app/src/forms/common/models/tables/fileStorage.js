const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FileStorage extends Timestamps(Model) {
  static get tableName() {
    return 'file_storage';
  }

  static get relationMappings() {
    const FormSubmission = require('./formSubmission');

    return {
      submission: {
        relation: Model.HasOneRelation,
        modelClass: FormSubmission,
        join: {
          from: 'file_storage.formSubmissionId',
          to: 'form_submission.id',
        },
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id', 'originalName', 'mimeType', 'size', 'storage', 'path'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        originalName: { type: 'string', minLength: 1, maxLength: 1024 },
        mimeType: { type: 'string' },
        size: { type: 'integer' },
        storage: { type: 'string' },
        path: { type: 'string', minLength: 1, maxLength: 1024 },
        formSubmissionId: { type: ['string', 'null'], pattern: Regex.UUID },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FileStorage;
