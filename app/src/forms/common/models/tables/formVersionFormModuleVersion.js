const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormVersionFormModuleVersion extends Timestamps(Model) {
  static get tableName() {
    return 'form_version_form_module_version';
  }

  static get relationMappings() {
    const FormVersion = require('./formVersion');
    const FormModuleVersion = require('./formModuleVersion');

    return {
      formVersion: {
        relation: Model.HasOneRelation,
        modelClass: FormVersion,
        join: {
          from: 'form_version_form_module_version.formVersionId',
          to: 'form_version.id',
        },
      },
      formModuleVersion: {
        relation: Model.HasOneRelation,
        modelClass: FormModuleVersion,
        join: {
          from: 'form_version_form_module_version.formModuleVersionId',
          to: 'form_module_version.id',
        },
      },
    };
  }

  static get modifiers() {
    return {
      filterFormVersionId(query, value) {
        if (value !== undefined) {
          query.where('formVersionId', value);
        }
      },
      filterFormModuleVersionId(query, value) {
        if (value !== undefined) {
          query.where('formModuleVersionId', value);
        }
      },
      orderDefault(builder) {
        builder.orderBy('createdAt', 'desc');
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formVersionId', 'formModuleVersionId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formVersionId: { type: 'string', pattern: Regex.UUID },
        formModuleVersionId: { type: 'string', pattern: Regex.UUID },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormVersionFormModuleVersion;
