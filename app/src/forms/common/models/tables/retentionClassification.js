const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const stamps = require('../jsonSchema').stamps;

class RetentionClassification extends Timestamps(Model) {
  static get tableName() {
    return 'retention_classification';
  }

  static get relationMappings() {
    const RetentionPolicy = require('./retentionPolicy');
    return {
      policies: {
        relation: Model.HasManyRelation,
        modelClass: RetentionPolicy,
        join: {
          from: 'retention_classification.id',
          to: 'retention_policy.retentionClassificationId',
        },
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['code', 'display'],
      properties: {
        id: { type: 'string' },
        code: { type: 'string', minLength: 1, maxLength: 50 },
        display: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: ['string', 'null'] },
        active: { type: 'boolean' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = RetentionClassification;
