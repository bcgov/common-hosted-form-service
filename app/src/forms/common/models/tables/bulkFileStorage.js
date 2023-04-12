const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class BulkFileStorage extends Timestamps(Model) {
  static get tableName() {
    return 'bulk_file_storage';
  }
  static get modifiers() {
    return {
      filterSubmitterId(query, value) {
        if (value !== undefined) {
          query.where('userIdBf', value);
        }
      },
      orderDescending(builder) {
        builder.orderBy('createdAt', 'desc');
      },
    };
  }

  static get relationMappings() {
    const FormSubmission = require('./formSubmission');
    return {
      versions: {
        relation: Model.HasManyRelation,
        modelClass: FormSubmission,
        join: {
          from: 'bulk_file_storage.id',
          to: 'form_submission.idBulkFile',
        },
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userIdBf', 'originalName', 'file'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        userIdBf: { type: 'string', pattern: Regex.UUID },
        originalName: { type: 'string' },
        description: { type: 'string' },
        file: { type: 'binary' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = BulkFileStorage;
