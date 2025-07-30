const { v4: uuidv4 } = require('uuid');
const stamps = require('../stamps');
const { ApprovalStatusCodes } = require('../../forms/common/constants');

const CREATED_BY = 'migration-074';

const defaultFormModule = {
  id: uuidv4(),
  pluginName: 'default',
  active: true,
};

const defaultFormModules = [defaultFormModule];

const defaultFormModuleVersion = {
  id: uuidv4(),
  formModuleId: defaultFormModule.id,
  externalUris: [
    'https://jasonchung1871.github.io/chefs_modules/bcgov-formio-components.use.min.js',
    'https://jasonchung1871.github.io/chefs_modules/bcgov-formio-components.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  ],
  config: {
    components: {
      categories: {
        layoutControls: {
          title: 'Basic Layout',
          default: true,
          weight: 10,
        },
        entryControls: {
          title: 'Basic Fields',
          weight: 20,
        },
        layout: {
          title: 'Advanced Layout',
          weight: 30,
        },
        advanced: {
          title: 'Advanced Fields',
          weight: 40,
        },
        data: {
          title: 'Advanced Data',
          weight: 50,
        },
        customControls: {
          title: 'BC Government',
          weight: 60,
        },
      },
      builder: {
        layoutControls: {
          simplecols2: true,
          simplecols3: true,
          simplecols4: true,
          simplecontent: true,
          simplefieldset: false,
          simpleheading: false,
          simplepanel: true,
          simpleparagraph: false,
          simpletabs: true,
        },
        entryControls: {
          simplecheckbox: true,
          simplecheckboxes: true,
          simpledatetime: true,
          simpleday: true,
          simpleemail: true,
          simplenumber: true,
          simplephonenumber: true,
          simpleradios: true,
          simpleselect: true,
          simpletextarea: true,
          simpletextfield: true,
          simpletime: false,
        },
        advanced: {
          simpletextfieldadvanced: true,
          simpleemailadvanced: true,
          simpletextareaadvanced: true,
          simpleurladvanced: true,
          simplenumberadvanced: true,
          simplephonenumberadvanced: true,
          simpleaddressadvanced: true,
          simplepasswordadvanced: true,
          simpledatetimeadvanced: true,
          simplecheckboxadvanced: true,
          simpledayadvanced: true,
          simpletimeadvanced: true,
          simpleselectadvanced: true,
          simplecurrencyadvanced: true,
          simpleradioadvanced: true,
          simplebuttonadvanced: true,
          simplesurveyadvanced: true,
          simplesignatureadvanced: true,
          email: false,
          url: false,
          phoneNumber: false,
          tags: false,
          address: false,
          datetime: false,
          day: false,
          time: false,
          currency: false,
          survey: false,
          signature: false,
          orgbook: false,
          bcaddress: false,
          simplebcaddress: false,
        },
        customControls: {
          orgbook: true,
          bcaddress: true,
          simplebcaddress: true,
          map: true,
          simplefile: true,
        },
      },
    },
    config: {
      GEO_ADDRESS_API_URL: '/api/v1/bcgeoaddress/advance/address',
    },
  },
  createdBy: CREATED_BY,
};

const statusCodes = [
  { code: ApprovalStatusCodes.REQUESTED, display: 'Requested', createdBy: CREATED_BY },
  { code: ApprovalStatusCodes.PENDING, display: 'Pending', createdBy: CREATED_BY },
  { code: ApprovalStatusCodes.APPROVED, display: 'Approved', createdBy: CREATED_BY },
  { code: ApprovalStatusCodes.DENIED, display: 'Denied', createdBy: CREATED_BY },
];

exports.up = function (knex) {
  return (
    Promise.resolve()
      .then(() =>
        // A form.io module (i.e., components)
        knex.schema.createTable('form_module', (table) => {
          table.uuid('id').primary();
          table.string('pluginName').notNullable();
          table.boolean('active').notNullable().defaultTo(true);
          stamps(knex, table);
        })
      )
      .then(() => {
        return knex('form_module').insert(defaultFormModules);
      })
      .then(() =>
        // When a new version of a form module is added
        knex.schema.createTable('form_module_version', (table) => {
          table.uuid('id').primary();
          table.uuid('formModuleId').notNullable().index().references('id').inTable('form_module').onUpdate('CASCADE').onDelete('CASCADE');
          table.specificType('externalUris', 'text[]').notNullable();
          table.jsonb('config');
          stamps(knex, table);
        })
      )
      .then(() => {
        return knex('form_module_version').insert(defaultFormModuleVersion);
      })
      .then(() =>
        // The identity providers required for a form module
        knex.schema.createTable('form_module_identity_provider', (table) => {
          table.uuid('id').primary();
          table.uuid('formModuleId').notNullable().index().references('id').inTable('form_module').onUpdate('CASCADE').onDelete('CASCADE');
          table.string('code').notNullable().references('code').inTable('identity_provider');
          stamps(knex, table);
        })
      )
      .then(() =>
        knex('identity_provider')
          .select('code')
          .then((identityProviders) => {
            const rows = identityProviders.map((provider) => ({
              id: uuidv4(),
              formModuleId: defaultFormModule.id,
              code: provider.code,
              createdBy: CREATED_BY,
            }));
            return rows.length ? knex('form_module_identity_provider').insert(rows) : Promise.resolve();
          })
      )
      .then(() =>
        // The modules that a form version is using
        knex.schema.createTable('form_version_form_module_version', (table) => {
          table.uuid('id').primary();
          table.uuid('formVersionId').notNullable().index().references('id').inTable('form_version').onUpdate('CASCADE').onDelete('CASCADE');
          table.uuid('formModuleVersionId').notNullable().index().references('id').inTable('form_module_version').onUpdate('CASCADE').onDelete('CASCADE');
          stamps(knex, table);
        })
      )
      .then(() =>
        knex('form_version')
          .select('id')
          .then((formVersions) => {
            const rows = formVersions.map((formVersion) => ({
              id: uuidv4(),
              formVersionId: formVersion.id,
              formModuleVersionId: defaultFormModuleVersion.id,
              createdBy: CREATED_BY,
            }));
            return rows.length ? knex('form_version_form_module_version').insert(rows) : Promise.resolve();
          })
      )
      .then(() =>
        // The modules that a form version is using
        knex.schema.createTable('approval_status_code', (table) => {
          table.string('code').primary();
          table.string('display').notNullable();
          stamps(knex, table);
        })
      )
      // seed the table
      .then(() => knex('approval_status_code').insert(statusCodes))
      .then(() =>
        // The modules that a form version is using
        knex.schema.createTable('approval_status_history', (table) => {
          table.uuid('id').primary();
          table.string('entityType', 255).notNullable(); // e.g., 'cors_domain_request'
          table.uuid('entityId').notNullable().index();
          table.string('statusCode').notNullable().references('code').inTable('approval_status_code').onUpdate('CASCADE').onDelete('CASCADE');
          table.string('comment');
          stamps(knex, table);
        })
      )
      .then(() =>
        knex.schema.createTable('cors_domain_request', (table) => {
          table.uuid('id').primary();
          table.uuid('formId').notNullable().index().references('id').inTable('form').onUpdate('CASCADE').onDelete('CASCADE');
          table.string('domain', 255).notNullable();
          table.string('statusCode').notNullable().references('code').inTable('approval_status_code').onUpdate('CASCADE').onDelete('CASCADE');
          table.string('createdBy').defaultTo('public');
          table.timestamp('createdAt', { useTz: true }).defaultTo(knex.fn.now());
        })
      )
  );
};

exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropTableIfExists('cors_domain_request'))
    .then(() => knex.schema.dropTableIfExists('approval_status_history'))
    .then(() => knex.schema.dropTableIfExists('approval_status_code'))
    .then(() => knex.schema.dropTableIfExists('form_version_form_module_version'))
    .then(() => knex.schema.dropTableIfExists('form_module_identity_provider'))
    .then(() => knex.schema.dropTableIfExists('form_module_version'))
    .then(() => knex.schema.dropTableIfExists('form_module'));
};
