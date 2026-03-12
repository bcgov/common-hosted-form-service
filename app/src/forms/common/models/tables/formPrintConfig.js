const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormPrintConfig extends Timestamps(Model) {
  static get tableName() {
    return 'form_print_config';
  }

  static get relationMappings() {
    const Form = require('./form');
    const DocumentTemplate = require('./documentTemplate');
    const FormPrintConfigTypeCode = require('./formPrintConfigTypeCode');

    return {
      form: {
        relation: Model.BelongsToOneRelation,
        modelClass: Form,
        join: {
          from: 'form_print_config.formId',
          to: 'form.id',
        },
      },
      documentTemplate: {
        relation: Model.BelongsToOneRelation,
        modelClass: DocumentTemplate,
        join: {
          from: 'form_print_config.templateId',
          to: 'document_template.id',
        },
      },
      typeCode: {
        relation: Model.HasOneRelation,
        modelClass: FormPrintConfigTypeCode,
        join: {
          from: 'form_print_config.code',
          to: 'form_print_config_type_code.code',
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
      findByIdAndFormId(query, id, formId) {
        if (id !== undefined && formId !== undefined) {
          query.where('id', id).where('formId', formId);
        }
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId', 'code'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        code: { type: 'string' },
        templateId: {
          anyOf: [{ type: 'string', pattern: Regex.UUID }, { type: 'null' }],
        },
        outputFileType: { type: ['string', 'null'] },
        reportName: {
          anyOf: [{ type: 'string' }, { type: 'null' }],
        },
        reportNameOption: {
          anyOf: [{ type: 'string' }, { type: 'null' }],
        },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormPrintConfig;
