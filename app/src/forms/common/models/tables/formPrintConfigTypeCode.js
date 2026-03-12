const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const stamps = require('../jsonSchema').stamps;

class FormPrintConfigTypeCode extends Timestamps(Model) {
  static get tableName() {
    return 'form_print_config_type_code';
  }

  static get idColumn() {
    return 'code';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['code'],
      properties: {
        code: { type: 'string' },
        display: { type: 'string' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormPrintConfigTypeCode;
