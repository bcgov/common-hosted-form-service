const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class ApprovalStatusHistory extends Timestamps(Model) {
  static get tableName() {
    return 'approval_status_history';
  }

  static get relationMappings() {
    const ApprovalStatusCode = require('./approvalStatusCode');

    return {
      approvalStatusCode: {
        relation: Model.HasOneRelation,
        modelClass: ApprovalStatusCode,
        join: {
          from: 'approval_status_history.statusCode',
          to: 'approval_status_code.id',
        },
      },
    };
  }

  static get modifiers() {
    return {
      filterEntityType(query, value) {
        if (value !== undefined) {
          query.where('entityType', value);
        }
      },
      filterEntityId(query, value) {
        if (value !== undefined) {
          query.where('entityId', value);
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

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['entityType', 'entityId', 'statusCode'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        entityType: { type: 'string', minLength: 1, maxLength: 255 },
        entityId: { type: 'string', minLength: 1, pattern: Regex.UUID },
        statusCode: { type: 'string', minLength: 1 },
        comment: { type: 'string' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = ApprovalStatusHistory;
