const stamps = require('../stamps');
const { FormEmbedDomainStatuses } = require('../../forms/common/constants');
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const CREATED_BY = 'migration-74';

const statusCodes = [
  { code: FormEmbedDomainStatuses.SUBMITTED, display: 'Submitted', createdBy: CREATED_BY },
  { code: FormEmbedDomainStatuses.PENDING, display: 'Pending', createdBy: CREATED_BY },
  { code: FormEmbedDomainStatuses.APPROVED, display: 'Approved', createdBy: CREATED_BY },
  { code: FormEmbedDomainStatuses.DENIED, display: 'Denied', createdBy: CREATED_BY },
];
exports.up = function (knex) {
  return (
    Promise.resolve()
      .then(() =>
        knex.schema.createTable('form_embed_domain_status_code', (table) => {
          table.string('code').primary();
          table.string('display').notNullable();
          stamps(knex, table);
        })
      )
      // seed the table
      .then(() => {
        return knex('form_embed_domain_status_code').insert(statusCodes);
      })
      .then(() =>
        knex.schema.createTable('form_embed_domain', (table) => {
          table.uuid('id').primary();
          table.uuid('formId').references('id').inTable('form').notNullable().index();
          table.string('domain');
          table.string('status').references('code').inTable('form_embed_domain_status_code').defaultTo('submitted'); // submitted, pending, approved, denied
          table.timestamp('requestedAt', { useTz: true }).defaultTo(knex.fn.now());
          table.string('requestedBy').notNullable();
          table.unique(['formId', 'domain']);
        })
      )
      .then(() =>
        knex.schema.createTable('form_embed_domain_history', (table) => {
          table.uuid('id').primary();
          table.uuid('formEmbedDomainId').references('id').inTable('form_embed_domain').notNullable().index();
          table.string('previousStatus');
          table.string('newStatus').notNullable();
          table.text('reason').nullable();
          stamps(knex, table);
        })
      )
      .then(() =>
        knex.schema.raw(
          `create or replace view form_embed_domain_vw as
              select frd.id, f.ministry, f.name as "formName", frd."domain",
                      frd.status, frd."requestedAt", frd."requestedBy"
              from form_embed_domain frd
              inner join form f on frd."formId" = f.id
              order by f.ministry, "formName", frd."domain";`
        )
      )
      .then(() =>
        knex.schema.raw(
          `create or replace view form_embed_domain_history_vw as
              select
                frd.id as "formEmbedDomainId",
                f.ministry,
                f.name as "formName",
                frd."domain",
                h.id as "historyId",
                h."previousStatus",
                h."newStatus",
                h.reason,
                h."createdAt" as "statusChangedAt",
                h."createdBy" as "statusChangedBy"
              from form_embed_domain_history h
              inner join form_embed_domain frd on h."formEmbedDomainId" = frd.id
              inner join form f on frd."formId" = f.id
              order by h."createdAt" desc;`
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
    .then(() => knex.schema.raw('DROP VIEW IF EXISTS form_embed_domain_history_vw'))
    .then(() => knex.schema.raw('DROP VIEW IF EXISTS form_embed_domain_vw'))
    .then(() => knex.schema.dropTableIfExists('form_embed_domain_history'))
    .then(() => knex.schema.dropTableIfExists('form_embed_domain'))
    .then(() => knex.schema.dropTableIfExists('form_embed_domain_status_code'));
};
