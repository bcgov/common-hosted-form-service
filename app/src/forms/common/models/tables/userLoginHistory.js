const { Model } = require('objection');
const { Regex } = require('../../constants');

class UserLoginHistory extends Model {
  static get tableName() {
    return 'user_login_history';
  }

  static get idColumn() {
    return ['userId', 'idpCode'];
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId', 'idpCode'],
      properties: {
        userId: { type: 'string', pattern: Regex.UUID },
        idpCode: { type: 'string', maxLength: 255 },
        lastLoginAt: { type: 'string' },
      },
      additionalProperties: false,
    };
  }
}

module.exports = UserLoginHistory;
