const stamps = require('../stamps');

exports.up = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.createTable('identity_provider', table => {
      table.string('code').primary();
      table.string('display').notNullable();
      table.boolean('active').notNullable().defaultTo(true);
      table.string('idp');
      stamps(knex, table);
    }))
    .then(() => knex.schema.createTable('user', table => {
      table.uuid('id').primary();
      table.string('keycloakId').unique().notNullable().index();
      table.string('firstName');
      table.string('fullName');
      table.string('lastName');
      table.string('username');
      table.string('email');
      stamps(knex, table);
    }))
    .then(() => knex.schema.createTable('role', table => {
      table.string('code').primary();
      table.string('display').notNullable();
      table.boolean('active').notNullable().defaultTo(true);
      table.string('description');
      stamps(knex, table);
    }))
    .then(() => knex.schema.createTable('permission', table => {
      table.string('code').primary();
      table.string('display').notNullable();
      table.boolean('active').notNullable().defaultTo(true);
      table.string('description');
      stamps(knex, table);
    }))
    .then(() => knex.schema.createTable('role_permission', table => {
      table.uuid('id').primary();
      table.string('role').references('code').inTable('role').notNullable().index();
      table.string('permission').references('code').inTable('permission').notNullable().index();
      stamps(knex, table);
    }))
    .then(() => knex.schema.createTable('form', table => {
      table.uuid('id').primary();
      table.string('name').notNullable();
      table.string('description');
      table.boolean('active').notNullable().defaultTo(true);
      table.specificType('labels', 'text ARRAY').comment('Use labels to group forms together, or aid in search. Examples: Ministry name, Branch name, Team name.');
      stamps(knex, table);
    }))
    .then(() => knex.schema.createTable('form_identity_provider', table => {
      table.uuid('id').primary();
      table.uuid('formId').references('id').inTable('form').notNullable().index();
      table.string('code').references('code').inTable('identity_provider').notNullable();
      stamps(knex, table);
    }))
    .then(() => knex.schema.createTable('form_role_user', table => {
      table.uuid('id').primary();
      table.string('role').references('code').inTable('role').notNullable();
      table.uuid('formId').references('id').inTable('form').notNullable().index();
      table.uuid('userId').references('id').inTable('user').notNullable().index();
      stamps(knex, table);
    }))
    .then(() => knex.schema.createTable('form_version', table => {
      table.uuid('id').primary();
      table.uuid('formId').references('id').inTable('form').notNullable().index();
      table.integer('version').notNullable();
      table.jsonb('schema');
      stamps(knex, table);
      table.unique(['formId', 'version']);
    }))
    .then(() => knex.schema.createTable('form_submission', table => {
      table.uuid('id').primary();
      table.uuid('formVersionId').references('id').inTable('form_version').notNullable().index();
      table.string('confirmationId').notNullable().unique().index();
      table.boolean('draft').notNullable().defaultTo(false);
      table.boolean('deleted').notNullable().defaultTo(false);
      table.jsonb('submission');
      stamps(knex, table);
    }));
};

exports.down = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropTableIfExists('form_identity_provider'))
    .then(() => knex.schema.dropTableIfExists('identity_provider'))
    .then(() => knex.schema.dropTableIfExists('form_submission'))
    .then(() => knex.schema.dropTableIfExists('form_version'))
    .then(() => knex.schema.dropTableIfExists('form_role_user'))
    .then(() => knex.schema.dropTableIfExists('form'))
    .then(() => knex.schema.dropTableIfExists('role_permission'))
    .then(() => knex.schema.dropTableIfExists('permission'))
    .then(() => knex.schema.dropTableIfExists('role'))
    .then(() => knex.schema.dropTableIfExists('user'));
};
