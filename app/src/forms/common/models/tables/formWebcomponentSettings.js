const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormWebcomponentSettings extends Timestamps(Model) {
  static get tableName() {
    return 'form_webcomponent_settings';
  }

  static get relationMappings() {
    const Form = require('./form');

    return {
      form: {
        relation: Model.BelongsToOneRelation,
        modelClass: Form,
        join: {
          from: 'form_webcomponent_settings.formId',
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
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        allowedOrigins: { type: 'array', items: { type: 'string', maxLength: 255 } },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormWebcomponentSettings;
