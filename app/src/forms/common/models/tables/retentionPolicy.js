const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class RetentionPolicy extends Timestamps(Model) {
  static get tableName() {
    return 'retention_policy';
  }

  static get relationMappings() {
    const Form = require('./form');
    const RetentionClassification = require('./retentionClassification');
    return {
      form: {
        relation: Model.BelongsToOneRelation,
        modelClass: Form,
        join: {
          from: 'retention_policy.formId',
          to: 'form.id',
        },
      },
      classification: {
        relation: Model.BelongsToOneRelation,
        modelClass: RetentionClassification,
        join: {
          from: 'retention_policy.retentionClassificationId',
          to: 'retention_classification.id',
        },
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
        retentionDays: { type: ['integer', 'null'] },
        retentionClassificationId: { type: ['string', 'null'], pattern: Regex.UUID },
        retentionClassificationDescription: { type: ['string', 'null'] },
        enabled: { type: 'boolean' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = RetentionPolicy;
