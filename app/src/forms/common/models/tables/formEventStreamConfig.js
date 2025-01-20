const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormEventStreamConfig extends Timestamps(Model) {
  static get tableName() {
    return 'form_event_stream_config';
  }

  static get relationMappings() {
    const FormEncryptionKey = require('./formEncryptionKey');

    return {
      encryptionKey: {
        relation: Model.HasOneRelation,
        modelClass: FormEncryptionKey,
        join: {
          from: 'form_event_stream_config.encryptionKeyId',
          to: 'form_encryption_key.id',
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
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        enablePublicStream: { type: 'boolean', default: false },
        enablePrivateStream: { type: 'boolean', default: false },
        encryptionKeyId: { type: ['string', 'null'], pattern: Regex.UUID },
        enabled: { type: 'boolean', default: false },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormEventStreamConfig;
