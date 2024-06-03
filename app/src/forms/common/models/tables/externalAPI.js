const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

const { encryptionService } = require('../../../../components/encryptionService');

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

  async $beforeInsert(context) {
    await super.$beforeInsert(context);
    if (this.apiKey) {
      this.apiKey = encryptionService.encryptDb(this.apiKey);
    }
    if (this.userInfoEncryptionKey) {
      this.userInfoEncryptionKey = encryptionService.encryptDb(this.userInfoEncryptionKey);
    }
  }

  async $beforeUpdate(context) {
    await super.$beforeUpdate(context);
    if (this.apiKey) {
      this.apiKey = encryptionService.encryptDb(this.apiKey);
    }
    if (this.userInfoEncryptionKey) {
      this.userInfoEncryptionKey = encryptionService.encryptDb(this.userInfoEncryptionKey);
    }
  }

  async $afterFind(context) {
    await super.$afterFind(context);
    if (this.apiKey) {
      this.apiKey = encryptionService.decryptDb(this.apiKey);
    }
    if (this.userInfoEncryptionKey) {
      this.userInfoEncryptionKey = encryptionService.decryptDb(this.userInfoEncryptionKey);
    }
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
        apiKeyHeader: { type: 'string' },
        apiKey: { type: 'string' },
        sendUserToken: { type: 'boolean', default: false },
        userTokenHeader: { type: 'string' },
        userTokenBearer: { type: 'boolean', default: true },
        sendUserInfo: { type: 'boolean', default: false },
        userInfoHeader: { type: 'string' },
        userInfoEncrypted: { type: 'boolean', default: false },
        userInfoEncryptionKey: { type: 'string' },
        userInfoEncryptionAlgo: { type: 'string' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = ExternalAPI;
