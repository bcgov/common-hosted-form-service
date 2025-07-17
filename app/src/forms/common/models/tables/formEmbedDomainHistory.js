const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormEmbedDomainHistory extends Timestamps(Model) {
  static get tableName() {
    return 'form_embed_domain_history';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id', 'formEmbedDomainId', 'newStatus', 'createdBy'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formEmbedDomainId: { type: 'string', pattern: Regex.UUID },
        previousStatus: { type: ['string', 'null'], maxLength: 50 },
        newStatus: { type: 'string', minLength: 1, maxLength: 50 },
        reason: { type: ['string', 'null'] },
        ...stamps,
      },
    };
  }

  static get relationMappings() {
    const FormEmbedDomain = require('./formEmbedDomain');

    return {
      domain: {
        relation: Model.BelongsToOneRelation,
        modelClass: FormEmbedDomain,
        join: {
          from: 'form_embed_domain_history.formEmbedDomainId',
          to: 'form_embed_domain.id',
        },
      },
    };
  }

  static get modifiers() {
    return {
      filterDomainId(query, formEmbedDomainId) {
        if (formEmbedDomainId) {
          query.where('formEmbedDomainId', formEmbedDomainId);
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
      orderByCreatedAt(query, direction = 'desc') {
        query.orderBy('createdAt', direction);
      },
      orderDefault(builder) {
        builder.orderBy('createdAt', 'desc');
      },
    };
  }
}

module.exports = FormEmbedDomainHistory;
