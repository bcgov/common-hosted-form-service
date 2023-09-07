const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormVersion extends Timestamps(Model) {
  static get tableName() {
    return 'form_version';
  }

  static get relationMappings() {
    const FormSubmission = require('./formSubmission');

    return {
      submissions: {
        relation: Model.HasManyRelation,
        modelClass: FormSubmission,
        join: {
          from: 'form_version.id',
          to: 'form_submission.formVersionId',
        },
      },
    };
  }

  static get modifiers() {
    return {
      selectWithoutSchema(builder) {
        builder.select('id', 'formId', 'version', 'published', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt');
      },
      filterVersion(query, value) {
        if (value && value > 0) {
          query.where('version', value);
        }
      },
      filterFormId(query, value) {
        if (value !== undefined) {
          query.where('formId', value);
        }
      },
      filterPublished(query, value) {
        if (value !== undefined) {
          query.where('published', value);
        }
      },
      onlyPublished(query) {
        query.where('published', true);
      },
      orderVersionDescending(builder) {
        builder.orderBy('version', 'desc');
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId', 'version', 'schema'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        version: { type: 'integer' },
        schema: { type: 'object' },
        published: { type: 'boolean' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormVersion;
