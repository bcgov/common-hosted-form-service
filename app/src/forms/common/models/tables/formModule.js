const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormModule extends Timestamps(Model) {
  static get tableName() {
    return 'form_module';
  }

  static get relationMappings() {
    const FormModuleVersion = require('./formModuleVersion');
    const IdentityProvider = require('./identityProvider');
    const FormModuleIdentityProvider = require('./formModuleIdentityProvider');

    return {
      formModuleVersions: {
        relation: Model.HasManyRelation,
        modelClass: FormModuleVersion,
        join: {
          from: 'form_module.id',
          to: 'form_module_version.formModuleId',
        },
      },
      idpHints: {
        relation: Model.HasManyRelation,
        modelClass: FormModuleIdentityProvider,
        filter: query => query.select('code'),
        join: {
          from: 'form_module.id',
          to: 'form_module_identity_provider.formModuleId',
        },
      },
      identityProviders: {
        relation: Model.ManyToManyRelation,
        modelClass: IdentityProvider,
        join: {
          from: 'form_module.id',
          through: {
            from: 'form_module_identity_provider.formModuleId',
            to: 'form_module_identity_provider.code',
          },
          to: 'identity_provider.code',
        },
      },
    };
  }

  static get modifiers() {
    return {
      filterId(query, value) {
        if (value !== undefined) {
          query.where('id', value);
        }
      },
      filterPluginName(query, value) {
        if (value !== undefined) {
          query.where('pluginName', value);
        }
      },
      filterActive(query, value) {
        if (value !== undefined) {
          query.where('active', value);
        }
      },
      onlyActive(query) {
        query.where('active', true);
      },
      orderPluginNameAscending(builder) {
        builder.orderByRaw('lower("pluginName")');
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id', 'pluginName'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        pluginName: { type: 'string', minLength: 1, maxLength: 255 },
        active: { type: 'boolean' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }

}

module.exports = FormModule;
