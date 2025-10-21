/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const { v4: uuidv4 } = require('uuid');

exports.seed = async function (knex) {
  const now = new Date().toISOString();

  // Insert form_admin role
  await knex('role').insert([
    {
      code: 'form_admin',
      display: 'Form Admin',
      active: true,
      description: 'Form admin role from CSTAR',
      createdBy: 'migration-002',
      createdAt: now,
      updatedBy: null,
      updatedAt: now,
    },
  ]);

  // Insert role_permission for form_admin
  const permissions = [
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

  const rolePermissions = permissions.map((p) => ({
    id: uuidv4(),
    role: 'form_admin',
    permission: p.permission,
    createdBy: p.createdBy,
    createdAt: now,
    updatedBy: null,
    updatedAt: now,
  }));

  await knex('role_permission').insert(rolePermissions);
};
