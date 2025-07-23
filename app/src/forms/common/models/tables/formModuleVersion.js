const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormModuleVersion extends Timestamps(Model) {
  static get tableName() {
    return 'form_module_version';
  }

  static get relationMappings() {
    const FormVersionFormModuleVersion = require('./formVersionFormModuleVersion');

    return {
      versions: {
        relation: Model.HasManyRelation,
        modelClass: FormVersionFormModuleVersion,
        join: {
          from: 'form_module_version.id',
          to: 'form_version_form_module_version.formModuleVersionId'
        }
      }
    };
  }

  static get modifiers() {
    return {
      selectWithoutUrisAndData(builder) {
        builder.select('id', 'formModuleId', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt');
      },
      filterFormModuleId(query, value) {
        if (value !== undefined) {
          query.where('formModuleId', value);
        }
      },
      orderCreatedAtDescending(builder) {
        builder.orderBy('createdAt', 'desc');
      },
      orderUpdatedAtDescending(builder) {
        builder.orderBy('updatedAt', 'desc');
      }
    };
  }

  // exclude externalUris array from explicit JSON conversion
  // encounter malformed array literal
  static get jsonAttributes() {
    return ['id', 'formModuleId', 'importData', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'];
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formModuleId', 'externalUris'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formModuleId: { type: 'string', pattern: Regex.UUID },
        externalUris: { type: ['array'], items: { type: 'string' } },
        importData: { type: 'string' },
        config: { type: 'object' },
        ...stamps
      },
      additionalProperties: false
    };
  }

}

module.exports = FormModuleVersion;
