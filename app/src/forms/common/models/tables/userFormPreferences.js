const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class UserFormPreferences extends Timestamps(Model) {
  static get tableName() {
    return 'user_form_preferences';
  }

  // This is a composite key - order of attributes is important
  static get idColumn() {
    return ['userId', 'formId'];
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId', 'userId'],
      properties: {
        userId: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        preferences: { type: 'object' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = UserFormPreferences;
