const { Model } = require('objection');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class CorsDomainRequest extends Model {
  static get tableName() {
    return 'cors_domain_request';
  }

  static get relationMappings() {
    const ApprovalStatusCode = require('./approvalStatusCode');
    const Form = require('./form');

    return {
      approvalStatusCode: {
        relation: Model.HasOneRelation,
        modelClass: ApprovalStatusCode,
        join: {
          from: 'approval_status_history.statusCode',
          to: 'approval_status_code.id',
        },
      },
      form: {
        relation: Model.HasOneRelation,
        modelClass: Form,
        join: {
          from: 'cors_domain_request.formId',
          to: 'form.id',
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
      filterDomain(query, value) {
        if (value !== undefined) {
          query.where('domain', value);
        }
      },
      filterStatusCode(query, value) {
        if (value !== undefined) {
          query.where('statusCode', value);
        }
      },
      orderDescending(builder) {
        builder.orderBy('createdAt', 'desc');
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId', 'domain', 'statusCode'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', minLength: 1, pattern: Regex.UUID },
        domain: { type: 'string', minLength: 1, maxLength: 255 },
        statusCode: { type: 'string', minLength: 1 },
        createdBy: stamps.createdBy,
        createdAt: stamps.createdAt,
      },
      additionalProperties: false,
    };
  }
}

module.exports = CorsDomainRequest;
