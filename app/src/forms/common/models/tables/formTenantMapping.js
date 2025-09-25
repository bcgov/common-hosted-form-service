const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormTanantMapping extends Timestamps(Model) {
  static get tableName() {
    return 'form_tenant_mapping';
  }
  static get relationMappings() {
    const Form = require('./form');

    return {
      form: {
        relation: Model.HasOneRelation,
        modelClass: Form,
        join: {
          from: 'form_tenant_mapping.formId',
          to: 'form.id',
        },
      },
    };
  }
  static get modifiers() {
    return {
      filterFormId(query, value) {
        if (value) {
          query.where('formId', value);
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
      required: ['formId', 'tenantId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        tenantId: { type: 'string', pattern: Regex.UUID },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormTanantMapping;
