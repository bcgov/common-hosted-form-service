const stamps = require('../stamps');

exports.up = function (knex) {
  return Promise.resolve()
    .then(() =>
      knex.schema.createTable('form_subscription', (table) => {
        table.uuid('id').primary();
        table.uuid('formVersionId').references('id').inTable('form_version').notNullable().index();
        table.string('name');
        table.string('description');
        table.string('subscribeEvent');
        table.string('endPointUrl').notNullable();
        table.string('endPointToken').notNullable();
        stamps(knex, table);
      })
    )
    .then(() =>
      knex.schema.raw(`create view subscription_vw as
      select s.id as "submissionId", f.id as "formId", f.name as "formName", fv.id as "formVersionId", fv.version,
      fs.name as "subscribeName", fs."subscribeEvent", fs."endPointUrl", fs."endPointToken"
      from form_submission as s
          inner join form_version fv on s."formVersionId" = fv.id
          inner join form f on fv."formId" = f.id
          inner join form_subscription fs on s."formVersionId" = fs."formVersionId"
      `)
    );
};

exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw('DROP VIEW IF EXISTS subscription_vw'))
    .then(() => knex.schema.dropTableIfExists('form_subscription'));
};
