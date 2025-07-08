const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormEmbedDomain extends Timestamps(Model) {
  static get tableName() {
    return 'form_embed_domain';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId', 'domain', 'status', 'requestedBy'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        domain: { type: 'string', minLength: 1, maxLength: 255 },
        status: { type: 'string', minLength: 1, maxLength: 50 },
        requestedAt: { type: ['string', 'null'] },
        requestedBy: { type: ['string', 'null'] },
        ...stamps,
      },
    };
  }

  static get relationMappings() {
    const Form = require('./form');
    const FormEmbedDomainStatusCode = require('./formEmbedDomainStatusCode');
    const FormEmbedDomainHistory = require('./formEmbedDomainHistory');

    return {
      form: {
        relation: Model.BelongsToOneRelation,
        modelClass: Form,
        join: {
          from: 'form_embed_domain.formId',
          to: 'form.id',
        },
      },
      statusCode: {
        relation: Model.BelongsToOneRelation,
        modelClass: FormEmbedDomainStatusCode,
        join: {
          from: 'form_embed_domain.status',
          to: 'form_embed_domain_status_code.code',
        },
      },
      history: {
        relation: Model.HasManyRelation,
        modelClass: FormEmbedDomainHistory,
        join: {
          from: 'form_embed_domain.id',
          to: 'form_embed_domain_history.formEmbedDomainId',
        },
      },
    };
  }

  static get modifiers() {
    return {
      filterFormId(query, formId) {
        if (formId) {
          query.where('formId', formId);
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
      filterRequestedBy(query, requestedBy) {
        if (requestedBy) {
          query.where('requestedBy', requestedBy);
        }
      },
      orderByRequestDate(query, direction = 'desc') {
        query.orderBy('requestedAt', direction);
      },
    };
  }
}

module.exports = FormEmbedDomain;
