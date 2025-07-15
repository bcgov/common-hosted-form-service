const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormVersionDraft extends Timestamps(Model) {
  static get tableName() {
    return 'form_version_draft';
  }

  static get relationMappings() {
    const FormVersion = require('./formVersion');

    return {
      version: {
        relation: Model.HasManyRelation,
        modelClass: FormVersion,
        join: {
          from: 'form_version_draft.formVersionId',
          to: 'form_version.id',
        },
      },
    };
  }

  static get modifiers() {
    return {
      filterFormId(query, value) {
        if (value !== undefined) {
          query.where('formId', value);
        }
      },
      filterFormVersionId(query, value) {
        if (value !== undefined) {
          query.where('formVersionId', value);
        }
      },
      orderDescending(builder) {
        builder.orderBy('updatedAt', 'desc');
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId', 'schema'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        formVersionId: { type: ['string', 'null'], pattern: Regex.UUID },
        schema: { type: 'object' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormVersionDraft;
