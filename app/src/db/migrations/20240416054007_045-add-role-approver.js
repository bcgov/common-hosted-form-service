const { v4: uuidv4 } = require('uuid');

const CREATED_BY = 'migration-045';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve()
    .then(() => {
      const items = [
        {
          createdBy: CREATED_BY,
          code: 'submission_approver',
          display: 'Approver',
          description: "Can review all form submissions but can't edit the submission.",
        },
      ];
      return knex('role').insert(items);
    })
    .then(() => {
      const items = [];

      ['form_read', 'submission_read', 'team_read'].forEach((p) => {
        const item = {
          id: uuidv4(),
          createdBy: CREATED_BY,
          role: 'submission_approver',
          permission: p,
        };

        items.push(item);
      });

      return knex('role_permission').insert(items).returning('id');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve()
    .then(() => {
      knex('role_permission')
        .where({
          createdBy: CREATED_BY,
        })
        .del();
    })
    .then(() => {
      knex('role')
        .where({
          createdBy: CREATED_BY,
        })
        .del();
    });
};
