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
    const FormIdentityProvider = require('./formIdentityProvider');
    const FormVersion = require('./formVersion');
    const FormVersionDraft = require('./formVersionDraft');
    const IdentityProvider = require('./identityProvider');
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
        relation: Model.HasManyRelation,
        modelClass: FormIdentityProvider,
        filter: (query) => query.select('code'),
        join: {
          from: 'form.id',
          to: 'form_identity_provider.formId',
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
      'enableStatusUpdates',
      'schedule',
      'reminder_enabled',
      'createdBy',
      'createdAt',
      'updatedBy',
      'updatedAt',
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
        showSubmissionConfirmation: { type: 'boolean' },
        submissionReceivedEmails: { type: ['array', 'null'], items: { type: 'string', pattern: Regex.EMAIL } },
        enableStatusUpdates: { type: 'boolean' },
        enableSubmitterDraft: { type: 'boolean' },
        schedule: { type: 'object' },
        reminder_enabled: { type: 'boolean' },
        enableCopyExistingSubmission: { type: 'boolean' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = Form;
