const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormDocumentGeneration extends Timestamps(Model) {
  static get tableName() {
    return 'form_document_generation';
  }

  static get modifiers() {
    return {
      filterFormId(query, value) {
        if (value) {
          query.where('formId', value);
        }
      },
      filterSubmissionId(query, value) {
        if (value) {
          query.where('submissionId', value);
        }
      },
      filterGeneratorVersion(query, value) {
        if (value) {
          query.where('generatorVersion', value);
        }
      },
      filterOutcome(query, value) {
        if (value) {
          query.where('outcome', value);
        }
      },
      orderDefault(builder) {
        builder.orderBy('createdAt', 'DESC');
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId', 'generatorVersion', 'outcome'],
      properties: {
        id: { type: 'integer' },
        formId: { type: 'string', pattern: Regex.UUID },
        submissionId: { type: ['string', 'null'], pattern: Regex.UUID },
        generatorVersion: { type: 'string', maxLength: 255 },
        outcome: { type: 'string', maxLength: 255 },
        httpStatus: { type: ['integer', 'null'] },
        durationMs: { type: ['integer', 'null'] },
        errorDetail: { type: ['string', 'null'] },
        tenantId: { type: ['string', 'null'], pattern: Regex.UUID },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormDocumentGeneration;
