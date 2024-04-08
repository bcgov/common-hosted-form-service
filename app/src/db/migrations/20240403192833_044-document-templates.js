const uuid = require('uuid');

const stamps = require('../stamps');
const { Permissions, Roles } = require('../../forms/common/constants');

const CREATED_BY = 'migration-044';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema
      .createTable('document_template', (table) => {
        table.uuid('id').primary();
        table.uuid('formId').references('id').inTable('form').notNullable().index();
        table.boolean('active').defaultTo(true);
        table.string('filename', 1024).notNullable();
        table.binary('template').notNullable();
        stamps(knex, table);
      })

      .then(() =>
        knex.schema.alterTable('form', (table) => {
          table.boolean('enableDocumentTemplates').defaultTo(false).comment('Allow document templates to be stored');
        })
      )

      .then(() => {
        const permission = {
          createdBy: CREATED_BY,
          code: Permissions.DOCUMENT_TEMPLATE_CREATE,
          display: 'Document Template Create',
          description: 'Can create document templates for a form',
          active: true,
        };
        return knex('permission').insert(permission);
      })
      .then(() => {
        const permission = {
          createdBy: CREATED_BY,
          code: Permissions.DOCUMENT_TEMPLATE_DELETE,
          display: 'Document Template Delete',
          description: 'Can delete document templates for a form',
          active: true,
        };
        return knex('permission').insert(permission);
      })
      .then(() => {
        const permission = {
          createdBy: CREATED_BY,
          code: Permissions.DOCUMENT_TEMPLATE_READ,
          display: 'Document Template Read',
          description: 'Can view document templates for a form',
          active: true,
        };
        return knex('permission').insert(permission);
      })

      .then(() => {
        const rolePermission = {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          role: Roles.OWNER,
          permission: Permissions.DOCUMENT_TEMPLATE_CREATE,
        };
        return knex('role_permission').insert(rolePermission);
      })
      .then(() => {
        const rolePermission = {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          role: Roles.OWNER,
          permission: Permissions.DOCUMENT_TEMPLATE_DELETE,
        };
        return knex('role_permission').insert(rolePermission);
      })
      .then(() => {
        const rolePermission = {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          role: Roles.OWNER,
          permission: Permissions.DOCUMENT_TEMPLATE_READ,
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

    .then(() =>
      knex.schema.alterTable('form', (table) => {
        table.dropColumn('enableDocumentTemplates');
      })
    )

    .then(() => knex.schema.dropTableIfExists('document_template'));
};
