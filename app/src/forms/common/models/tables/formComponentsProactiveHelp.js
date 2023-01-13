const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormComponentsProactiveHelp extends Timestamps(Model) {
  static get tableName() {
    return 'form_components_proactive_help';
  }

  static get modifiers() {
    return {
      findByComponentName(query, value) {
        if (value !== undefined) {
          query.where('componentname', value);
        }
      },
      distinctOnComponentName(builder) {
        builder.distinctOn('componentname');
      },
      orderComponentNameVersionsDescending(builder) {

        builder.orderBy(['componentname',{column:'version', order:'desc'}]);

      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id','componentname','version','groupname'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        componentname: { type: 'string', minLength: 1, maxLength: 255 },
        externallink: { type: 'string' },
        image: { type: 'string' },
        componentimagename: { type: 'string' },
        imagetype: { type: 'string' },
        version: { type: 'integer'},
        groupname: { type: 'string', minLength: 1, maxLength: 255 },
        publishstatus:{type:'boolean'},
        islinkenabled: {type:'boolean'},
        description: { type: 'string'},
        ...stamps
      },
      additionalProperties: false
    };
  }

}

module.exports = FormComponentsProactiveHelp;
