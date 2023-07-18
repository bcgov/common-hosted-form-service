const { Model } = require('objection');

class SubmissionData extends Model {
  static get tableName() {
    return 'submissions_data_vw';
  }

  static get modifiers() {
    return {
      filterVersion(query, value) {
        if (value) {
          query.where('version', value);
        }
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
      filterUpdatedAt(query, minDate, maxDate) {
        if (minDate && maxDate) {
          query.whereBetween('updatedAt', [minDate, maxDate]);
        } else if (minDate) {
          query.where('updatedAt', '>=', minDate);
        } else if (maxDate) {
          query.where('updatedAt', '<=', maxDate);
        }
      },
      filterStatus(query, value) {
        if (value) {
          query.where('status', value);
        }
      },
      filterDeleted(query, value) {
        if (!value) {
          query.where('deleted', false);
        }
      },
      filterDrafts(query, value) {
        if (!value) {
          query.where('draft', false);
        }
      },
      orderDefault(builder) {
        builder.orderBy('createdAt', 'DESC');
      },
    };
  }
}

module.exports = SubmissionData;
