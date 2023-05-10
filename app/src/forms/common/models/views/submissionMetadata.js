const { Model } = require('objection');

class SubmissionMetadata extends Model {
  static get tableName() {
    return 'submissions_vw';
  }

  static get modifiers() {
    return {
      filterSubmissionId(query, value) {
        if (value) {
          query.where('submissionId', value);
        }
      },
      filterConfirmationId(query, value) {
        if (value) {
          query.where('confirmationId', value);
        }
      },
      filterDraft(query, value) {
        if (value !== undefined) {
          query.where('draft', value);
        }
      },
      filterDeleted(query, value) {
        if (value !== undefined) {
          query.where('deleted', value);
        }
      },
      filterCreatedBy(query, value) {
        if (value) {
          query.where('createdBy', 'ilike', `%${value}%`);
        }
      },
      filterFormId(query, value) {
        if (value) {
          query.where('formId', value);
        }
      },
      filterFormName(query, value) {
        if (value) {
          query.where('formName', 'ilike', `%${value}%`);
        }
      },
      filterFormVersionId(query, value) {
        if (value) {
          query.where('formVersionId', value);
        }
      },
      filterVersion(query, value) {
        if (value) {
          query.where('version', value);
        }
      },
      orderDefault(builder) {
        builder.orderBy('createdAt', 'DESC');
      },
      filterCreatedAt(query, minDate, maxDate) {
        if (minDate && maxDate) {
          query.whereBetween('createdAt', [minDate, maxDate]);
        } else if (minDate) {
          query.where('createdAt', '>=', minDate);
        } else if (maxDate) {
          query.where('createdAt', '<=', maxDate);
        }
      },
    };
  }
}

module.exports = SubmissionMetadata;
