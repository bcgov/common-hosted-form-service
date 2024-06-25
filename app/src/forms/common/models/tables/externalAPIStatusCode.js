const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const stamps = require('../jsonSchema').stamps;

class ExternalAPIStatusCode extends Timestamps(Model) {
  static get tableName() {
    return 'external_api_status_code';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['code'],
      properties: {
        code: { type: 'string' },
        display: { type: 'string' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = ExternalAPIStatusCode;
