const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormComponentsHelpInfo extends Timestamps(Model) {
  static get tableName() {
    return 'form_components_help_info';
  }

  static get modifiers() {
    return {
      distinctOnComponentName(builder) {
        builder.distinctOn('componentname'); 
      },
      orderComponentNameVersionsDescending(builder) {
        
        builder.orderBy(['componentname',{column:'versions', order:'desc'}]);
        
      },
    };
  }
  
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id','componentname','versions','groupname','description'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        componentname: { type: 'string', minLength: 1, maxLength: 255 },
        morehelpinfolink: { type: 'string' },
        imageurl: { type: 'string' },
        versions: { type: 'integer'},
        groupname: { type: 'string', minLength: 1, maxLength: 255 },
        publishstatus:{type:'boolean'},
        description: { type: 'string',minLength: 1,},
        ...stamps
      },
      additionalProperties: false
    };
  }

}

module.exports = FormComponentsHelpInfo;
