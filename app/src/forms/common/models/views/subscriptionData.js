const { Model } = require('objection');

class SubscriptionData extends Model {
  static get tableName() {
    return 'subscriptions_vw';
  }

  static get modifiers() {
    return {
      filterFormId(query, value) {
        if (value) {
          query.where('formId', value);
        }
      },
      filterSubscribeEvent(query, value) {
        if (value) {
          query.where('subscribeEvent', value);
        }
      },
    };
  }
}

module.exports = SubscriptionData;