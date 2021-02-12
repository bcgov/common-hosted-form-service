const stamps = require('../stamps');

exports.up = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.createTable('form_submission_user', table => {
      table.uuid('id').primary();
      table.uuid('formSubmissionId').references('id').inTable('form_submission').notNullable().index();
      table.uuid('userId').references('id').inTable('user').notNullable().index();
      table.string('permission').references('code').inTable('permission').notNullable();
      stamps(knex, table);
    }))
    .then(() => knex.schema.raw(`create view form_submission_users_vw as
select fsu."formSubmissionId", fsu."userId", array_agg(distinct(fsu.permission)) as permissions
from form_submission_user fsu
group by fsu."formSubmissionId", fsu."userId"`));
};

exports.down = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw('DROP VIEW IF EXISTS form_submission_users_vw'))
    .then(() => knex.schema.dropTableIfExists('form_submission_user'));
};
