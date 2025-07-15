const { v4: uuidv4 } = require('uuid');

const stamps = require('../stamps');

const { EmailTypes, Permissions, Roles } = require('../../forms/common/constants');

const CREATED_BY = 'migration-036';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema
      .createTable('form_email_template', (table) => {
        table.uuid('id').primary();
        table.uuid('formId').references('id').inTable('form').notNullable().index();
        table.enu('type', [EmailTypes.SUBMISSION_CONFIRMATION]).notNullable();
        table.unique(['formId', 'type']);
        table.string('subject').notNullable();
        table.string('title').notNullable();
        table.string('body', 4096).notNullable();
        stamps(knex, table);
      })

      .then(() => {
        const permission = {
          createdBy: CREATED_BY,
          code: Permissions.EMAIL_TEMPLATE_READ,
          display: 'Email Template Read',
          description: 'Can view the email templates for a form',
          active: true,
        };
        return knex('permission').insert(permission);
      })
      .then(() => {
        const permission = {
          createdBy: CREATED_BY,
          code: Permissions.EMAIL_TEMPLATE_UPDATE,
          display: 'Email Template Update',
          description: 'Can update the email templates for a form',
          active: true,
        };
        return knex('permission').insert(permission);
      })

      .then(() => {
        const rolePermission = {
          id: uuidv4(),
          createdBy: CREATED_BY,
          role: Roles.OWNER,
          permission: Permissions.EMAIL_TEMPLATE_READ,
        };
        return knex('role_permission').insert(rolePermission);
      })
      .then(() => {
        const rolePermission = {
          id: uuidv4(),
          createdBy: CREATED_BY,
          role: Roles.OWNER,
          permission: Permissions.EMAIL_TEMPLATE_UPDATE,
        };
        return knex('role_permission').insert(rolePermission);
      })
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve()
    .then(() =>
      knex('role_permission')
        .where({
          createdBy: CREATED_BY,
        })
        .del()
    )

    .then(() =>
      knex('permission')
        .where({
          createdBy: CREATED_BY,
        })
        .del()
    )

    .then(() => knex.schema.dropTableIfExists('form_email_template'));
};
