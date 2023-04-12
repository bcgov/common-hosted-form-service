const { Model } = require('objection');
const { Regex } = require('../../constants');

class SubmissionAudit extends Model {
  static get tableName() {
    return 'form_submission_audit';
  }

  static get modifiers() {
    return {
      filterId(query, value) {
        if (value) {
          query.where('id', value);
        }
      },
      filterSubmissionId(query, value) {
        if (value) {
          query.where('submissionId', value);
        }
      },
      filterDraft(query, value) {
        query.whereRaw('("originalData"->>\'draft\')::boolean = ?', value);
      },
      orderDefault(builder) {
        builder.orderBy('actionTimestamp', 'DESC');
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['submissionId'],
      properties: {
        id: { type: 'integer' },
        submissionId: { type: 'string', pattern: Regex.UUID },
        dbUser: { type: 'string', maxLength: 255 },
        updatedByUsername: { type: ['string', 'null'], maxLength: 255 },
        actionTimestamp: { type: ['string', 'null'] },
        action: { type: 'string', maxLength: 255 },
        originalData: { type: 'object' },
      },
      additionalProperties: false,
    };
  }
}

module.exports = SubmissionAudit;
