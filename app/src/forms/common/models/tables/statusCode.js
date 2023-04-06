const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class StatusCode extends Timestamps(Model) {
  static get tableName() {
    return 'status_code';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['code'],
      properties: {
        code: { type: 'string' },
        display: { type: 'string' },
        nextCodes: { type: ['array', 'null'], items: { type: 'string', pattern: Regex.EMAIL } },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = StatusCode;
