const { Model } = require('objection');
const Regex = require('../../../common/constants').Regex;

class FormAudit extends Model {
  static get tableName() {
    return 'form_audit';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId', 'action', 'dbUser'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        actionTimestamp: { type: 'string' },
        action: { type: 'string' },
        dbUser: { type: 'string' },
        updatedByUsername: { type: 'string' },
        originalData: { type: ['object', 'null'] },
        newData: { type: ['object', 'null'] },
      },
      additionalProperties: false,
    };
  }

  static get modifiers() {
    return {
      orderDescending(builder) {
        builder.orderBy('actionTimestamp', 'desc');
      },
      filterId(query, id) {
        query.where('id', id);
      },
      filterFormId(query, formId) {
        query.where('formId', formId);
      },
    };
  }
}

module.exports = FormAudit;
