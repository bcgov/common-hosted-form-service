const { Model } = require('objection');
const { Regex } = require('../../constants');

class FormRequestedDomain extends Model {
  static get tableName() {
    return 'form_requested_domains';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId', 'domain', 'requestedBy'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        domain: { type: 'string', minLength: 1, maxLength: 255 },
        status: { type: 'string', enum: ['pending', 'approved', 'denied'] },
        reason: { type: ['string', 'null'] },
        requestedAt: { type: ['string', 'null'] },
        requestedBy: { type: ['string', 'null'] },
        reviewedAt: { type: ['string', 'null'] },
        reviewedBy: { type: ['string', 'null'] },
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
          from: 'form_requested_domains.formId',
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
      filterStatus(query, status) {
        if (status) {
          query.where('status', status);
        }
      },
    };
  }
}

module.exports = FormRequestedDomain;
