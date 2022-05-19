const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class customComponentsHelpInfo extends Timestamps(Model) {
  static get tableName() {
    return 'custom_components_help_info';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id','tagName','imageLink','version','groupName','description'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        tagName: { type: 'string', permission: { type: 'string', minLength: 1, maxLength: 255 }},
        imageLink: { type: 'string', permission: { type: 'string', minLength: 1, maxLength: 255 }},
        version: { type: 'integer'},
        groupName: { type: 'string', permission: { type: 'string', minLength: 1, maxLength: 255 }},
        description: { type: 'string', permission: { type: 'string', minLength: 1 }},
        ...stamps
      },
      additionalProperties: false
    };
  }

}

module.exports = HelpInfoLinks;
