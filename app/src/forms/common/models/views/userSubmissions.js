const { Model } = require('objection');
const { getSortBy } = require('../../utils');

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
      filterSearch(query, value) {
        if (value) {
          query.where('confirmationId', 'ilike', `%${value}%`);
        }
      },
      orderDefault(builder) {
        builder.orderBy('createdAt', 'DESC');
      },
      userOrder(query, sortBy, sortDesc) {
        query.orderBy(getSortBy(sortBy[0]), sortDesc[0] === 'true' ? 'DESC' : 'ASC');
      },
    };
  }
}

module.exports = UserSubmissions;
