const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const stamps = require('../jsonSchema').stamps;

class CDOGSV3Config extends Timestamps(Model) {
  static get tableName() {
    return 'cdogs_v3_config';
  }

  static get modifiers() {
    return {
      filterFormId(query, value) {
        if (value !== undefined) {
          query.where('formId', value);
        }
      },
      findByFormId(query, formId) {
        if (formId !== undefined) {
          query.where('formId', formId);
        }
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        formId: { type: 'string', format: 'uuid' },
        enabled: { type: 'boolean' },
        ...stamps,
      },
    };
  }
}

module.exports = CDOGSV3Config;
