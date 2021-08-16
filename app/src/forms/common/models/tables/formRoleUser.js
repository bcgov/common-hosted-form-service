const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

const Form = require('./form');
const Role = require('./role');
const User = require('./user');

class FormRoleUser extends Timestamps(Model) {
  static get tableName() {
    return 'form_role_user';
  }

  static get relationMappings() {
    return {
      form: {
        relation: Model.HasOneRelation,
        modelClass: Form,
        join: {
          from: 'form_role_user.formId',
          to: 'form.id'
        }
      },
      userRole: {
        relation: Model.HasOneRelation,
        modelClass: Role,
        join: {
          from: 'form_role_user.role',
          to: 'role.code'
        }
      },
      user: {
        relation: Model.HasOneRelation,
        modelClass: User,
        join: {
          from: 'form_role_user.userId',
          to: 'user.id'
        }
      },
    };
  }

  static get modifiers() {
    return {
      orderCreatedAtDescending(builder) {
        builder.orderBy('createdAt', 'desc');
      },
      orderUpdatedAtDescending(builder) {
        builder.orderBy('updatedAt', 'desc');
      }
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['role', 'formId', 'userId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        userId: { type: 'string', pattern: Regex.UUID },
        role: { type: 'string', minLength: 1, maxLength: 255 },
        ...stamps
      },
      additionalProperties: false
    };
  }
}

module.exports = FormRoleUser;
