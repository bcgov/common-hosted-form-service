const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class ExternalAPI extends Timestamps(Model) {
  static get tableName() {
    return 'external_api';
  }

  static get relationMappings() {
    const ExternalAPIStatusCode = require('./externalAPIStatusCode');

    return {
      statusCode: {
        relation: Model.HasOneRelation,
        modelClass: ExternalAPIStatusCode,
        join: {
          from: 'external_api.code',
          to: 'external_api_status_code.code',
        },
      },
    };
  }

  static get modifiers() {
    return {
      filterFormId(query, value) {
        if (value) {
          query.where('formId', value);
        }
      },
      findByIdAndFormId(query, id, formId) {
        if (id !== undefined && formId !== undefined) {
          query.where('id', id).where('formId', formId);
        }
      },
      findByFormIdAndName(query, formId, name) {
        if (name !== undefined && formId !== undefined) {
          query.where('name', name).where('formId', formId);
        }
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId', 'name', 'code', 'endpointUrl'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        endpointUrl: { type: 'string' },
        code: { type: 'string' },
        sendApiKey: { type: 'boolean', default: false },
        apiKeyHeader: { type: ['string', 'null'] },
        apiKey: { type: ['string', 'null'] },
        allowSendUserToken: { type: 'boolean', default: false },
        sendUserToken: { type: 'boolean', default: false },
        userTokenHeader: { type: ['string', 'null'] },
        userTokenBearer: { type: 'boolean', default: true },
        sendUserInfo: { type: 'boolean', default: false },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = ExternalAPI;
