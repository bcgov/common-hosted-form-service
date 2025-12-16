const stamps = require('../stamps');
const { PrintConfigTypes } = require('../../forms/common/constants');
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const CREATED_BY = 'form-print-config-migration';

const typeCodes = [
  { code: PrintConfigTypes.DEFAULT, display: 'Default', createdBy: CREATED_BY },
  { code: PrintConfigTypes.DIRECT, display: 'Direct', createdBy: CREATED_BY },
];

exports.up = function (knex) {
  return (
    Promise.resolve()
      .then(() =>
        knex.schema.createTable('form_print_config_type_code', (table) => {
          table.string('code').primary();
          table.string('display').notNullable();
          stamps(knex, table);
        })
      )
      // seed the table
      .then(() => {
        return knex('form_print_config_type_code').insert(typeCodes);
      })
      .then(() =>
        knex.schema.createTable('form_print_config', (table) => {
          table.uuid('id').primary();
          table.uuid('formId').references('id').inTable('form').notNullable().index().unique().onDelete('CASCADE');
          table.string('code').references('code').inTable('form_print_config_type_code').notNullable().index();
          table.uuid('templateId').references('id').inTable('document_template');
          table.string('outputFileType', 10).defaultTo('pdf');
          stamps(knex, table);
        })
      )
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropTableIfExists('form_print_config'))
    .then(() => knex.schema.dropTableIfExists('form_print_config_type_code'));
};
