const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FeatureFlag extends Timestamps(Model) {
  static get tableName() {
    return 'feature_flag';
  }

  static get relationMappings() {
    const FeatureFlagForm = require('./featureFlagForm');
    const FeatureFlagTenant = require('./featureFlagTenant');

    return {
      forms: {
        relation: Model.HasManyRelation,
        modelClass: FeatureFlagForm,
        join: {
          from: 'feature_flag.id',
          to: 'feature_flag_form.featureFlagId',
        },
      },
      tenants: {
        relation: Model.HasManyRelation,
        modelClass: FeatureFlagTenant,
        join: {
          from: 'feature_flag.id',
          to: 'feature_flag_tenant.featureFlagId',
        },
      },
    };
  }

  static get modifiers() {
    return {
      findByCode(query, code) {
        if (code !== undefined) {
          query.where('code', code);
        }
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['code'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        code: { type: 'string', minLength: 1, maxLength: 255 },
        name: { type: ['string', 'null'], maxLength: 255 },
        description: { type: ['string', 'null'], maxLength: 255 },
        allowAll: { type: 'boolean' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FeatureFlag;
