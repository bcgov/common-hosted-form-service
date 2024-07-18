const stamps = require('../stamps');
const { ExternalAPIStatuses } = require('../../forms/common/constants');
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const CREATED_BY = 'migration-046';

const statusCodes = [
  { code: ExternalAPIStatuses.SUBMITTED, display: 'Submitted', createdBy: CREATED_BY },
  { code: ExternalAPIStatuses.PENDING, display: 'Pending', createdBy: CREATED_BY },
  { code: ExternalAPIStatuses.APPROVED, display: 'Approved', createdBy: CREATED_BY },
  { code: ExternalAPIStatuses.DENIED, display: 'Denied', createdBy: CREATED_BY },
];
exports.up = function (knex) {
  return (
    Promise.resolve()
      .then(() =>
        knex.schema.createTable('external_api_status_code', (table) => {
          table.string('code').primary();
          table.string('display').notNullable();
          stamps(knex, table);
        })
      )
      // seed the table
      .then(() => {
        return knex('external_api_status_code').insert(statusCodes);
      })
      .then(() =>
        knex.schema.createTable('external_api', (table) => {
          table.uuid('id').primary();
          table.uuid('formId').references('id').inTable('form').notNullable().index();
          table.string('name', 255).notNullable();
          table.string('endpointUrl').notNullable();
          table.string('code').references('code').inTable('external_api_status_code').notNullable().index();

          table.boolean('sendApiKey').defaultTo(false);
          table.string('apiKeyHeader');
          table.string('apiKey');

          table.boolean('allowSendUserToken').defaultTo(false);
          table.boolean('sendUserToken').defaultTo(false);
          table.string('userTokenHeader');
          table.boolean('userTokenBearer').defaultTo(true);

          table.boolean('sendUserInfo').defaultTo(false);
          stamps(knex, table);
        })
      )
      .then(() =>
        knex.schema.raw(
          `create or replace view external_api_vw as 
              select e.id, e."formId", f.ministry, f.name as "formName", e.name, e."endpointUrl",
                    e.code, easc.display, e."allowSendUserToken" from external_api e 
              inner join external_api_status_code easc on e.code = easc.code 
              inner join form f on e."formId" = f.id 
              order by f.ministry, "formName", e.name;`
        )
      )
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw('DROP VIEW IF EXISTS external_api_vw'))
    .then(() => knex.schema.dropTableIfExists('external_api'))
    .then(() => knex.schema.dropTableIfExists('external_api_status_code'));
};
