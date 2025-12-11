const { v4: uuidv4 } = require('uuid');
const stamps = require('../stamps');

const CREATED_BY = 'form-deletion-audit';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve()
    .then(() =>
      knex.schema.createTable('retention_classification', (table) => {
        table.uuid('id').primary();
        table.string('code').notNullable().unique().comment('Unique code (internal, public, sensitive, confidential, protected_a, protected_b, protected_c)');
        table.string('display').notNullable().comment('Display name for UI');
        table.text('description').nullable().comment('Description of classification');
        table.boolean('active').defaultTo(true);
        stamps(knex, table);
      })
    )
    .then(() =>
      knex('retention_classification').insert([
        {
          id: uuidv4(),
          code: 'public',
          display: 'Public',
          description: 'Public information that can be freely shared',
          active: true,
          createdBy: CREATED_BY,
        },
        {
          id: uuidv4(),
          code: 'internal',
          display: 'Internal',
          description: 'Internal BC government use only',
          active: true,
          createdBy: CREATED_BY,
        },
        {
          id: uuidv4(),
          code: 'sensitive',
          display: 'Sensitive',
          description: 'Sensitive information requiring careful handling',
          active: true,
          createdBy: CREATED_BY,
        },
        {
          id: uuidv4(),
          code: 'confidential',
          display: 'Confidential',
          description: 'Confidential information with restricted access',
          active: true,
          createdBy: CREATED_BY,
        },
        {
          id: uuidv4(),
          code: 'protected_a',
          display: 'Protected A',
          description: 'Protected A - Highest confidentiality requiring strong controls',
          active: true,
          createdBy: CREATED_BY,
        },
        {
          id: uuidv4(),
          code: 'protected_b',
          display: 'Protected B',
          description: 'Protected B - Confidential requiring enhanced controls',
          active: true,
          createdBy: CREATED_BY,
        },
        {
          id: uuidv4(),
          code: 'protected_c',
          display: 'Protected C',
          description: 'Protected C - Confidential requiring standard controls',
          active: true,
          createdBy: CREATED_BY,
        },
      ])
    )
    .then(() =>
      knex.schema.createTable('retention_policy', (table) => {
        table.uuid('id').primary().defaultTo(uuidv4());
        table.uuid('formId').notNullable().unique().references('id').inTable('form').comment('Form ID this policy applies to');
        table.integer('retentionDays').nullable().comment('Days before hard deletion allowed (null = indefinite, default behavior)');
        table.uuid('retentionClassificationId').nullable().references('id').inTable('retention_classification').comment('Retention classification');
        table.string('retentionClassificationDescription').nullable().comment('Custom description for the retention classification');
        stamps(knex, table);

        table.index(['formId']);
        table.index(['retentionClassificationId']);
      })
    )
    .then(() =>
      knex.schema.createTable('scheduled_submission_deletion', (table) => {
        table.uuid('id').primary().defaultTo(uuidv4());
        table.uuid('submissionId').notNullable().unique().references('id').inTable('form_submission').onDelete('CASCADE').comment('Submission eligible for deletion');
        table.uuid('formId').notNullable().references('id').inTable('form').comment('Form this submission belongs to');
        table.timestamp('eligibleForDeletionAt').notNullable().comment('Date/time when submission is eligible for hard deletion');
        table.string('status').defaultTo('pending').comment('pending, processing, completed, failed');
        table.text('failureReason').nullable().comment('Reason if deletion failed');
        stamps(knex, table);

        table.index(['formId']);
        table.index(['eligibleForDeletionAt']);
        table.index(['status']);
        table.index(['submissionId']);
      })
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropTableIfExists('scheduled_submission_deletion'))
    .then(() => knex.schema.dropTableIfExists('retention_policy'))
    .then(() => knex.schema.dropTableIfExists('retention_classification'));
};
