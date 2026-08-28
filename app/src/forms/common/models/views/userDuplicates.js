const { Model } = require('objection');

class UserDuplicates extends Model {
  static get tableName() {
    return 'user_duplicates_vw';
  }

  static get modifiers() {
    return {
      filterResolved(query, value) {
        if (value !== undefined) {
          query.where('isResolved', value);
        }
      },
      orderDefault(query) {
        query.orderBy('canonicalIdp').orderBy('matchType').orderBy('matchKey').orderBy('lastActivityAt', 'desc');
      },
    };
  }
}

module.exports = UserDuplicates;
