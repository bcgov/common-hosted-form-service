const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormGroup extends Timestamps(Model) {
  static get tableName() {
    return 'form_group';
  }
  static get relationMappings() {
    const Form = require('./form');

    return {
      form: {
        relation: Model.HasOneRelation,
        modelClass: Form,
        join: {
          from: 'form_group.formId',
          to: 'form.id',
        },
      },
    };
  }
  static get modifiers() {
    return {
      filterFormId(query, value) {
        if (value) {
          query.where('formId', value);
        }
      },
      filterGroupId(query, value) {
        if (value) {
          query.where('groupId', value);
        }
      },
    };
  }
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId', 'groupId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        groupId: { type: 'string', pattern: Regex.UUID },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormGroup;
