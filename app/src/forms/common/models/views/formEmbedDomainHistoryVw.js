const { Model } = require('objection');
const { Regex } = require('../../constants');

class FormEmbedDomainHistoryVw extends Model {
  static get tableName() {
    return 'form_embed_domain_history_vw';
  }

  static get idColumn() {
    return 'historyId';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        formEmbedDomainId: { type: 'string', pattern: Regex.UUID },
        ministry: { type: 'string' },
        formName: { type: 'string' },
        domain: { type: 'string' },
        historyId: { type: 'string', pattern: Regex.UUID },
        previousStatus: { type: ['string', 'null'] },
        newStatus: { type: 'string' },
        reason: { type: ['string', 'null'] },
        statusChangedAt: { type: ['string', 'null'] },
        statusChangedBy: { type: ['string', 'null'] },
      },
    };
  }

  static get modifiers() {
    return {
      formEmbedDomainId(query, formEmbedDomainId) {
        if (formEmbedDomainId) {
          query.where('formEmbedDomainId', formEmbedDomainId);
        }
      },
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
      filterPreviousStatus(query, status) {
        if (status) {
          query.where('previousStatus', status);
        }
      },
      filterNewStatus(query, status) {
        if (status) {
          query.where('newStatus', status);
        }
      },
      orderByStatusChangedAt(query, direction = 'desc') {
        query.orderBy('statusChangedAt', direction);
      },
      orderDefault(builder) {
        builder.orderBy('statusChangedAt', 'desc');
      },
    };
  }
}

module.exports = FormEmbedDomainHistoryVw;
