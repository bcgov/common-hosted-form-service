/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.raw('DROP VIEW IF EXISTS external_api_vw');

  await knex.schema.alterTable('external_api', (table) => {
    table.string('endpointUrl', 512).notNullable().alter();
  });

  await knex.schema.alterTable('form_subscription', (table) => {
    table.string('endpointUrl', 512).notNullable().alter();
  });

  await knex.schema.raw(`
      create or replace view external_api_vw as 
        select e.id, e."formId", f.ministry, f.name as "formName", e.name, e."endpointUrl",
              e.code, easc.display, e."allowSendUserToken"
        from external_api e
        inner join external_api_status_code easc on e.code = easc.code
        inner join form f on e."formId" = f.id
        order by f.ministry, "formName", e.name;
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.raw('DROP VIEW IF EXISTS external_api_vw');

  await knex.schema.alterTable('external_api', (table) => {
    table.string('endpointUrl', 255).notNullable().alter();
  });

  await knex.schema.alterTable('form_subscription', (table) => {
    table.string('endpointUrl', 255).notNullable().alter();
  });

  await knex.schema.raw(`
      create or replace view external_api_vw as 
        select e.id, e."formId", f.ministry, f.name as "formName", e.name, e."endpointUrl",
              e.code, easc.display, e."allowSendUserToken"
        from external_api e
        inner join external_api_status_code easc on e.code = easc.code
        inner join form f on e."formId" = f.id
        order by f.ministry, "formName", e.name;
    `);
};
