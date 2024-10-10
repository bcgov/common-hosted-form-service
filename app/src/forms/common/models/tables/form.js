const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class Form extends Timestamps(Model) {
  static get tableName() {
    return 'form';
  }

  $parseDatabaseJson(json) {
    json = super.$parseDatabaseJson(json);
    // Need to make sure that name is a string (could be a number)
    if (json.name !== undefined) {
      json.name = json.name.toString();
    }
    return json;
  }

  snake() {
    // like a slug, but not guaranteed to be unique (as names are not unique).
    // use this for file names or any other instances we want a standardized name without punctuation etc.
    return this.name
      .replace(/\s+/g, '_')
      .replace(/[^-_0-9a-z]/gi, '')
      .toLowerCase();
  }

  static get virtualAttributes() {
    return ['snake'];
  }

  static get relationMappings() {
    const FormVersion = require('./formVersion');
    const FormVersionDraft = require('./formVersionDraft');
    const IdentityProvider = require('./identityProvider');
    const FormMetadata = require('./formMetadata');
    return {
      drafts: {
        relation: Model.HasManyRelation,
        modelClass: FormVersionDraft,
        join: {
          from: 'form.id',
          to: 'form_version_draft.formId',
        },
      },
      idpHints: {
        relation: Model.ManyToManyRelation,
        modelClass: IdentityProvider,
        filter: (query) => query.select('idp'),
        join: {
          from: 'form.id',
          through: {
            from: 'form_identity_provider.formId',
            to: 'form_identity_provider.code',
          },
          to: 'identity_provider.code',
        },
      },
      identityProviders: {
        relation: Model.ManyToManyRelation,
        modelClass: IdentityProvider,
        join: {
          from: 'form.id',
          through: {
            from: 'form_identity_provider.formId',
            to: 'form_identity_provider.code',
          },
          to: 'identity_provider.code',
        },
      },
      versions: {
        relation: Model.HasManyRelation,
        modelClass: FormVersion,
        join: {
          from: 'form.id',
          to: 'form_version.formId',
        },
      },
      formMetadata: {
        relation: Model.HasOneRelation,
        modelClass: FormMetadata,
        join: {
          from: 'form.id',
          to: 'form_metadata.formId',
        },
      },
    };
  }

  static get modifiers() {
    return {
      filterName(query, value) {
        if (value) {
          // ilike is postgres case insensitive like
          query.where('name', 'ilike', `%${value}%`);
        }
      },
      filterDescription(query, value) {
        if (value) {
          // ilike is postgres case insensitive like
          query.where('description', 'ilike', `%${value}%`);
        }
      },
      filterActive(query, value) {
        if (value !== undefined) {
          query.where('active', value);
        }
      },
      filterLabels(query, value) {
        if (value) {
          query.whereRaw(`'${value}' = ANY (labels)`);
        }
      },
      orderNameAscending(builder) {
        builder.orderByRaw('lower("name")');
      },
      reminderEnabled(query) {
        query.where('reminder_enabled', true);
      },
    };
  }

  // exclude labels and submissionReceivedEmails arrays from explicit JSON conversion
  // encounter malformed array literal
  static get jsonAttributes() {
    return [
      'id',
      'name',
      'description',
      'active',
      'allowSubmitterToUploadFile',
      'showSubmissionConfirmation',
      'enableDocumentTemplates',
      'enableStatusUpdates',
      'schedule',
      'subscribe',
      'reminder_enabled',
      'wideFormLayout',
      'createdBy',
      'createdAt',
      'updatedBy',
      'updatedAt',
      'deploymentLevel',
      'ministry',
      'apiIntegration',
      'useCase',
    ];
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: ['string', 'null'], maxLength: 255 },
        active: { type: 'boolean' },
        allowSubmitterToUploadFile: { type: 'boolean' },
        labels: { type: ['array', 'null'], items: { type: 'string' } },
        sendSubmissionReceivedEmail: { type: 'boolean' },
        showSubmissionConfirmation: { type: 'boolean' },
        submissionReceivedEmails: { type: ['array', 'null'], items: { type: 'string', pattern: Regex.EMAIL } },
        enableDocumentTemplates: { type: 'boolean' },
        enableStatusUpdates: { type: 'boolean' },
        enableSubmitterDraft: { type: 'boolean' },
        schedule: { type: 'object' },
        subscribe: { type: 'object' },
        reminder_enabled: { type: 'boolean' },
        wideFormLayout: { type: 'boolean' },
        enableCopyExistingSubmission: { type: 'boolean' },
        deploymentLevel: { type: 'string', minLength: 1, maxLength: 25 },
        ministry: { type: 'string', minLength: 1, maxLength: 25 },
        apiIntegration: { type: 'boolean' },
        useCase: { type: 'string', minLength: 1, maxLength: 25 },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = Form;
