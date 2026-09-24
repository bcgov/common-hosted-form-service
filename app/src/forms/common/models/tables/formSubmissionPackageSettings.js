const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormSubmissionPackageSettings extends Timestamps(Model) {
  static get tableName() {
    return 'form_submission_package_settings';
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

  // 'emails' is a Postgres text[] column, not JSON. Objection would otherwise
  // auto-detect the array-typed property and JSON.stringify it on write, which
  // Postgres rejects as a malformed array literal. There are no real JSON
  // columns here, so opt out of JSON serialization entirely.
  static get jsonAttributes() {
    return [];
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        enabled: { type: 'boolean' },
        templateId: {
          anyOf: [{ type: 'string', pattern: Regex.UUID }, { type: 'null' }],
        },
        emails: { type: ['array', 'null'], items: { type: 'string', pattern: Regex.EMAIL } },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormSubmissionPackageSettings;
