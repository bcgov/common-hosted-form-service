const { Model } = require('objection');
const { Regex } = require('../../constants');

class FormMigrationLog extends Model {
  static get tableName() {
    return 'form_migration_log';
  }

  static get relationMappings() {
    const Form = require('./form');

    return {
      form: {
        relation: Model.HasOneRelation,
        modelClass: Form,
        join: {
          from: 'form_migration_log.formId',
          to: 'form.id',
        },
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId', 'tenantId', 'createdBy'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        tenantId: { type: 'string', pattern: Regex.UUID },
        createdBy: { type: 'string', minLength: 1 },
        createdAt: { type: ['string', 'null'] },
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormMigrationLog;
