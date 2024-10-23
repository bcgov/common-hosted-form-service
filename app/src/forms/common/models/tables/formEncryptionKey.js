const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormEncryptionKey extends Timestamps(Model) {
  static get tableName() {
    return 'form_encryption_key';
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
      required: ['formId', 'name', 'algorithm', 'key'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        algorithm: { type: 'string' },
        key: { type: 'string' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormEncryptionKey;
