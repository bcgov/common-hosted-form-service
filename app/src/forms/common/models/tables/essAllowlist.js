const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const stamps = require('../jsonSchema').stamps;

class EssAllowlist extends Timestamps(Model) {
  static get tableName() {
    return 'ess_allowlist';
  }

  static get modifiers() {
    return {
      findByAccountName(query, accountName) {
        if (accountName !== undefined) {
          query.where('accountName', accountName);
        }
      },
    };
  }
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['accountName'],
      properties: {
        accountName: { type: 'string' },
        notes: { type: 'object' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = EssAllowlist;
