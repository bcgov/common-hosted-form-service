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
          query.where('componentName', value);
        }
      },
      findByComponentNameAndGroup(query, componentName, groupName) {
        if (componentName !== undefined && groupName !== undefined) {
          query.where('componentName', componentName).where('groupName', groupName);
        }
      },
      distinctOnComponentNameAndGroupName(builder) {
        builder.distinctOn(['componentName', 'groupName']);
      },
      selectWithoutImages(query) {
        query.select('id', 'componentName', 'externalLink', 'imageType', 'groupName', 'publishStatus', 'isLinkEnabled', 'description', 'componentImageName');
      },
      selectImageUrl(query, id) {
        query.select('image').where('id', id);
      },

      findByComponentId(query, value) {
        if (value !== undefined) {
          query.where('id', value);
        }
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id', 'componentName', 'groupName'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        componentName: { type: 'string', minLength: 1, maxLength: 255 },
        externalLink: { type: 'string' },
        image: { type: 'string' },
        componentImageName: { type: 'string' },
        imageType: { type: 'string' },
        groupName: { type: 'string', minLength: 1, maxLength: 255 },
        publishStatus: { type: 'boolean' },
        isLinkEnabled: { type: 'boolean' },
        description: { type: 'string' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormComponentsProactiveHelp;
