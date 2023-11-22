const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class Label extends Timestamps(Model) {
  static get tableName() {
    return 'label';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        userId: { type: 'string', pattern: Regex.UUID },
        labelDescription: { type: 'string', minLength: 1, maxLength: 255 },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = Label;
