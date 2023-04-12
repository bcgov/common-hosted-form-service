const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormSubmissionUser extends Timestamps(Model) {
  static get tableName() {
    return 'form_submission_user';
  }

  static get relationMappings() {
    const FormSubmission = require('./formSubmission');
    const Permission = require('./permission');
    const User = require('./user');

    return {
      submission: {
        relation: Model.HasOneRelation,
        modelClass: FormSubmission,
        join: {
          from: 'form_submission_user.submissionId',
          to: 'form_submission.id',
        },
      },
      userPermission: {
        relation: Model.HasOneRelation,
        modelClass: Permission,
        join: {
          from: 'form_submission_user.permission',
          to: 'permission.code',
        },
      },
      user: {
        relation: Model.HasOneRelation,
        modelClass: User,
        join: {
          from: 'form_submission_user.userId',
          to: 'user.id',
        },
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
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['permission', 'formSubmissionId', 'userId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formSubmissionId: { type: 'string', pattern: Regex.UUID },
        userId: { type: 'string', pattern: Regex.UUID },
        permission: { type: 'string', minLength: 1, maxLength: 255 },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormSubmissionUser;
