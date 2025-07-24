const stamps = require('../stamps');

exports.up = function (knex) {
  return Promise.resolve()
    .then(() =>
      // A form.io module (i.e., components)
      knex.schema.createTable('form_module', (table) => {
        table.uuid('id').primary();
        table.string('pluginName').notNullable();
        table.boolean('active').notNullable().defaultTo(true);
        stamps(knex, table);
      }))
    .then(() =>
      // When a new version of a form module is added
      knex.schema.createTable('form_module_version', (table) => {
        table.uuid('id').primary();
        table.uuid('formModuleId').notNullable().index().references('id').inTable('form_module').onUpdate('CASCADE').onDelete('CASCADE');
        table.specificType('externalUris', 'text[]').notNullable();
        table.jsonb('config');
        stamps(knex, table);
      }))
    .then(() =>
      // The identity providers required for a form module
      knex.schema.createTable('form_module_identity_provider', (table) => {
        table.uuid('id').primary();
        table.uuid('formModuleId').notNullable().index().references('id').inTable('form_module').onUpdate('CASCADE').onDelete('CASCADE');
        table.string('code').notNullable().references('code').inTable('identity_provider');
        stamps(knex, table);
      }))
    .then(() =>
      // The modules that a form version is using
      knex.schema.createTable('form_version_form_module_version', (table) => {
        table.uuid('id').primary();
        table.uuid('formVersionId').notNullable().index().references('id').inTable('form_version').onUpdate('CASCADE').onDelete('CASCADE');
        table.uuid('formModuleVersionId').notNullable().index().references('id').inTable('form_module_version').onUpdate('CASCADE').onDelete('CASCADE');
        stamps(knex, table);
      })
    );
};

exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropTableIfExists('form_version_form_module_version'))
    .then(() => knex.schema.dropTableIfExists('form_module_identity_provider'))
    .then(() => knex.schema.dropTableIfExists('form_module_version'))
    .then(() => knex.schema.dropTableIfExists('form_module'));
};
