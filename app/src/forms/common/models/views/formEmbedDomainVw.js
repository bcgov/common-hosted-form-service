const { Model } = require('objection');
const { Regex } = require('../../constants');

class FormEmbedDomainVw extends Model {
  static get tableName() {
    return 'form_embed_domain_vw';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        ministry: { type: 'string' },
        formName: { type: 'string' },
        domain: { type: 'string' },
        status: { type: 'string' },
        requestedAt: { type: ['string', 'null'] },
        requestedBy: { type: ['string', 'null'] },
      },
    };
  }

  static get modifiers() {
    return {
      filterMinistry(query, ministry) {
        if (ministry) {
          query.where('ministry', ministry);
        }
      },
      filterFormName(query, formName) {
        if (formName) {
          query.where('formName', 'ilike', `%${formName}%`);
        }
      },
      filterDomain(query, domain) {
        if (domain) {
          query.where('domain', 'ilike', `%${domain}%`);
        }
      },
      filterStatus(query, status) {
        if (status) {
          query.where('status', status);
        }
      },
      search(query, term) {
        if (term) {
          query.where(function () {
            this.where('formName', 'ilike', `%${term}%`).orWhere('domain', 'ilike', `%${term}%`);
          });
        }
      },
      orderByMinistry(query, direction = 'asc') {
        query.orderBy('ministry', direction);
      },
      orderByFormName(query, direction = 'asc') {
        query.orderBy('formName', direction);
      },
      orderByDomain(query, direction = 'asc') {
        query.orderBy('domain', direction);
      },
      orderByStatus(query, direction = 'asc') {
        query.orderBy('status', direction);
      },
      orderByRequestedAt(query, direction = 'desc') {
        query.orderBy('requestedAt', direction);
      },
    };
  }
}

module.exports = FormEmbedDomainVw;
