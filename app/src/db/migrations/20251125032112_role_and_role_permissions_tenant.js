const { v4: uuidv4 } = require('uuid');

const ROLE_CODE = 'form_admin';

const PERMISSIONS = [
  { permission: 'form_read', createdBy: 'migration-002' },
  { permission: 'form_update', createdBy: 'migration-002' },
  { permission: 'form_delete', createdBy: 'migration-002' },
  { permission: 'design_create', createdBy: 'migration-013' },
  { permission: 'design_delete', createdBy: 'migration-013' },
  { permission: 'design_read', createdBy: 'migration-013' },
  { permission: 'design_update', createdBy: 'migration-013' },
  { permission: 'submission_create', createdBy: 'migration-013' },
  { permission: 'submission_delete', createdBy: 'migration-013' },
  { permission: 'submission_read', createdBy: 'migration-013' },
  { permission: 'submission_update', createdBy: 'migration-013' },
  { permission: 'team_read', createdBy: 'migration-013' },
  { permission: 'team_update', createdBy: 'migration-013' },
  { permission: 'form_api_create', createdBy: 'migration-019' },
  { permission: 'form_api_read', createdBy: 'migration-019' },
  { permission: 'form_api_update', createdBy: 'migration-019' },
  { permission: 'form_api_delete', createdBy: 'migration-019' },
  { permission: 'email_template_read', createdBy: 'migration-036' },
  { permission: 'email_template_update', createdBy: 'migration-036' },
  { permission: 'document_template_create', createdBy: 'migration-044' },
  { permission: 'document_template_delete', createdBy: 'migration-044' },
  { permission: 'document_template_read', createdBy: 'migration-044' },
  { permission: 'submission_review', createdBy: 'migration-045' },
];

/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  const now = new Date().toISOString();
  return Promise.resolve()
    .then(() => {
      return knex('role').insert({
        code: ROLE_CODE,
        display: 'Form Admin',
        active: true,
        description: 'Form admin role from CSTAR',
        type: 'enterprise',
        createdBy: 'migration-002',
        createdAt: now,
        updatedBy: null,
        updatedAt: now,
      });
    })
    .then(async () => {
      for (const p of PERMISSIONS) {
        await knex('role_permission').insert({
          id: uuidv4(),
          role: ROLE_CODE,
          permission: p.permission,
          createdBy: p.createdBy,
          createdAt: now,
          updatedBy: null,
          updatedAt: now,
        });
      }
    });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex('role_permission').where({ role: ROLE_CODE }).del())
    .then(() => knex('role').where({ code: ROLE_CODE }).del());
};
