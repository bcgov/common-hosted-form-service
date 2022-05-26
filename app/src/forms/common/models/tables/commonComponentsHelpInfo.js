const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class CommonComponentsHelpInfo extends Timestamps(Model) {
  static get tableName() {
    return 'common_components_help_info';
  }

  static get modifiers() {
    return {
      distinctOnTagName(builder) {
        builder.distinctOn('tagname'); 
      },
      orderTagNameVersionsDescending(builder) {
        
        builder.orderBy(['tagname',{column:'versions', order:'desc'}]);
        
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id','tagname','taglink','versions','groupname','description'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        tagname: { type: 'string', minLength: 1, maxLength: 255 },
        taglink: { type: 'string' },
        imagelink: { type: 'string' },
        versions: { type: 'integer'},
        groupname: { type: 'string', minLength: 1, maxLength: 255 },
        publishstatus:{type:'boolean'},
        description: { type: 'string'},
        ...stamps
      },
      additionalProperties: false
    };
  }

}

module.exports = CommonComponentsHelpInfo;
