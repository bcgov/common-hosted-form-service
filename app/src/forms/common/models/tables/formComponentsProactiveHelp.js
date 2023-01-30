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
      findByComponentNameAndGroup(query, componentname, groupname) {
        if (componentname !== undefined && groupname!==undefined) {
          query.where('componentname', componentname)
            .where('groupname', groupname);
        }
      },
      distinctOnComponentNameAndGroupName(builder) {
        builder.distinctOn(['componentname', 'groupname']);
      },
      findByComponentId(query, value) {
        if (value !== undefined) {
          query.where('id', value);
        }
      }
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id','componentname','groupname'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        componentname: { type: 'string', minLength: 1, maxLength: 255 },
        externallink: { type: 'string' },
        image: { type: 'string' },
        componentimagename: { type: 'string' },
        imagetype: { type: 'string' },
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
