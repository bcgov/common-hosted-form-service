const { Model } = require('objection');

class AdminExternalAPI extends Model {
  static get tableName() {
    return 'external_api_vw';
  }

  static get modifiers() {
    return {
      filterMinistry(query, value) {
        if (value) {
          query.where('ministry', value);
        }
      },
      filterFormName(query, value) {
        if (value) {
          query.where('formName', 'ilike', `%${value}%`);
        }
      },
      filterName(query, value) {
        if (value) {
          query.where('name', 'ilike', `%${value}%`);
        }
      },
      filterDisplay(query, value) {
        if (value) {
          query.where('display', value);
        }
      },
      orderDefault(builder) {
        builder.orderByRaw('lower("ministry"), lower("formName"), lower("name")');
      },
    };
  }
}

module.exports = AdminExternalAPI;
