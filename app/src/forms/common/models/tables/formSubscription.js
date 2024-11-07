const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormSubscription extends Timestamps(Model) {
  static get tableName() {
    return 'form_subscription';
  }

  static get modifiers() {
    return {
      filterFormId(query, value) {
        if (value) {
          query.where('formId', value);
        }
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId', 'endpointUrl', 'endpointToken'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        subscribeEvent: { type: 'string' },
        endpointUrl: { type: 'string' },
        endpointToken: { type: 'string' },
        key: { type: 'string' },
        eventStreamNotifications: { type: 'boolean', default: false },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormSubscription;
