const { Model } = require('objection');

class FormEmbedDomainStatusCode extends Model {
  static get tableName() {
    return 'form_embed_domain_status_code';
  }

  static get idColumn() {
    return 'code';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['code', 'display'],
      properties: {
        code: { type: 'string', minLength: 1, maxLength: 50 },
        display: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: ['string', 'null'], maxLength: 1000 },
      },
    };
  }

  static get relationMappings() {
    const FormEmbedDomain = require('./formEmbedDomain');

    return {
      domains: {
        relation: Model.HasManyRelation,
        modelClass: FormEmbedDomain,
        join: {
          from: 'form_embed_domain_status_code.code',
          to: 'form_embed_domain.status',
        },
      },
    };
  }
}

module.exports = FormEmbedDomainStatusCode;
