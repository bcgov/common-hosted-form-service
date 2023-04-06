const { Model } = require('objection');

class PublicFormAccess extends Model {
  static get tableName() {
    return 'public_form_access_vw';
  }

  static get modifiers() {
    return {
      filterActive(query, value) {
        if (value !== undefined) {
          query.where('active', value);
        }
      },
      filterFormId(query, value) {
        if (value) {
          query.where('formId', value);
        }
      },
      orderDefault(builder) {
        builder.orderByRaw('lower("formName")');
      },
    };
  }
}

module.exports = PublicFormAccess;
