const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FeatureFlagForm extends Timestamps(Model) {
  static get tableName() {
    return 'feature_flag_form';
  }

  static get relationMappings() {
    const FeatureFlag = require('./featureFlag');
    const Form = require('./form');

    return {
      featureFlag: {
        relation: Model.BelongsToOneRelation,
        modelClass: FeatureFlag,
        join: {
          from: 'feature_flag_form.featureFlagId',
          to: 'feature_flag.id',
        },
      },
      form: {
        relation: Model.HasOneRelation,
        modelClass: Form,
        join: {
          from: 'feature_flag_form.formId',
          to: 'form.id',
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
      filterFormId(query, value) {
        if (value) {
          query.where('formId', value);
        }
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['featureFlagId', 'formId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        featureFlagId: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FeatureFlagForm;
