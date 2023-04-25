const { Model } = require('objection');

const utils = require('../utils');

class FormSubmissionUserPermissions extends Model {
  static get tableName() {
    return 'form_submission_users_vw';
  }

  static get modifiers() {
    return {
      filterSubmissionId(query, value) {
        if (value) {
          query.where('formSubmissionId', value);
        }
      },
      filterUserId(query, value) {
        if (value) {
          query.where('userId', value);
        }
      },
      filterByPermissions(query, permissions) {
        if (permissions) {
          const _permissions = utils.toArray(permissions);
          let clauses = [];

          if (_permissions.length) {
            clauses.push(utils.inArrayFilter('permissions', _permissions));
          }

          if (clauses.length) {
            query.whereRaw(`(${clauses.join(' or ')})`);
          }
        }
      },
    };
  }
}

module.exports = FormSubmissionUserPermissions;
