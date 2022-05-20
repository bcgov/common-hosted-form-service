const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class CommonComponentsHelpInfo extends Timestamps(Model) {
  static get tableName() {
    return 'common_components_help_info';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id','tagName','tagLink','version','groupName','description'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        tagName: { type: 'string', minLength: 1, maxLength: 255 },
        tagLink: { type: 'string' },
        imageLink: { type: 'string' },
        version: { type: 'integer'},
        groupName: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string'},
        ...stamps
      },
      additionalProperties: false
    };
  }

}

module.exports = CommonComponentsHelpInfo;
