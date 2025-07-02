const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormAllowedDomain extends Timestamps(Model) {
  static get tableName() {
    return 'form_allowed_domains';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId', 'domain', 'createdBy'],
      properties: {
        id: { type: 'string', format: 'uuid', pattern: Regex.UUID },
        formId: { type: 'string', format: 'uuid', pattern: Regex.UUID },
        domain: { type: 'string', minLength: 1, maxLength: 255 },
        ...stamps,
      },
    };
  }

  static get relationMappings() {
    const Form = require('./form');

    return {
      form: {
        relation: Model.BelongsToOneRelation,
        modelClass: Form,
        join: {
          from: 'form_allowed_domains.formId',
          to: 'form.id',
        },
      },
    };
  }

  static get modifiers() {
    return {
      filterFormId(query, formId) {
        if (formId) {
          query.where('formId', formId);
        }
      },
    };
  }
}

module.exports = FormAllowedDomain;
