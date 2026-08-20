const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FeatureFlagTenant extends Timestamps(Model) {
  static get tableName() {
    return 'feature_flag_tenant';
  }

  static get relationMappings() {
    const FeatureFlag = require('./featureFlag');

    return {
      featureFlag: {
        relation: Model.BelongsToOneRelation,
        modelClass: FeatureFlag,
        join: {
          from: 'feature_flag_tenant.featureFlagId',
          to: 'feature_flag.id',
        },
      },
    };
  }

  static get modifiers() {
    return {
      filterFeatureFlagId(query, value) {
        if (value) {
          query.where('featureFlagId', value);
        }
      },
      filterTenantId(query, value) {
        if (value) {
          query.where('tenantId', value);
        }
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['featureFlagId', 'tenantId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        featureFlagId: { type: 'string', pattern: Regex.UUID },
        tenantId: { type: 'string', pattern: Regex.UUID },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FeatureFlagTenant;
