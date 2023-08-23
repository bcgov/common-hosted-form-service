const { Model } = require('objection');

class UserSubmissions extends Model {
  static get tableName() {
    return 'submissions_submitters_vw';
  }

  static get relationMappings() {
    const FormSubmission = require('../tables/formSubmission');
    const FormSubmissionStatus = require('../tables/formSubmissionStatus');
    const User = require('../tables/user');

    return {
      submission: {
        relation: Model.HasOneRelation,
        modelClass: FormSubmission,
        join: {
          from: 'submissions_submitters_vw.formSubmissionId',
          to: 'form_submission.id',
        },
      },
      submissionStatus: {
        relation: Model.HasManyRelation,
        modelClass: FormSubmissionStatus,
        join: {
          from: 'submissions_submitters_vw.formSubmissionId',
          to: 'form_submission_status.submissionId',
        },
      },
      user: {
        relation: Model.HasOneRelation,
        modelClass: User,
        join: {
          from: 'submissions_submitters_vw.userId',
          to: 'user.id',
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
      filterFormSubmissionId(query, value) {
        if (value) {
          query.where('formSubmissionId', value);
        }
      },
      filterUserId(query, value) {
        if (value) {
          query.where('userId', value);
        }
      },
      filterActive(query, value) {
        if (value !== undefined) {
          query.where('deleted', !value);
        }
      },
      orderDefault(builder, pagination, params) {
        if (!pagination) {
          builder.orderBy('createdAt', 'DESC');
        } else {
          let orderBy = params?.sortBy;
          let orderDesc = params?.sortDesc;
          if (orderDesc === 'true') {
            builder.orderBy(orderBy, 'desc');
          } else if (orderDesc === 'false') {
            builder.orderBy(orderBy, 'asc');
          }
        }
      },
    };
  }
}

module.exports = UserSubmissions;
