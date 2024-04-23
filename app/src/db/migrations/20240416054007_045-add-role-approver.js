const { v4: uuidv4 } = require('uuid');
const { Permissions, Roles } = require('../../forms/common/constants');

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
          code: Roles.SUBMISSION_APPROVER,
          display: 'Approver',
          description: "Can review all form submissions but can't edit the submission.",
        },
      ];
      return knex('role').insert(items);
    })
    .then(() => {
      const items = [
        {
          createdBy: CREATED_BY,
          code: Permissions.SUBMISSION_REVIEW,
          display: 'Submission Review',
          description: 'Can add/read notes and update the status of a submission.',
          active: true,
        },
      ];

      return knex('permission').insert(items).returning('code');
    })
    .then(() => {
      const items = [];

      [Permissions.FORM_READ, Permissions.SUBMISSION_READ, Permissions.SUBMISSION_REVIEW, Permissions.TEAM_READ].forEach((p) => {
        const item = {
          id: uuidv4(),
          createdBy: CREATED_BY,
          role: Roles.SUBMISSION_APPROVER,
          permission: p,
        };

        items.push(item);
      });

      return knex('role_permission').insert(items).returning('id');
    })
    .then(() => {
      const rolePermssion = {
        id: uuidv4(),
        createdBy: CREATED_BY,
        role: Roles.OWNER,
        permission: Permissions.SUBMISSION_REVIEW,
      };

      return knex('role_permission').insert(rolePermssion);
    })
    .then(() => {
      const rolePermssion = {
        id: uuidv4(),
        createdBy: CREATED_BY,
        role: Roles.SUBMISSION_REVIEWER,
        permission: Permissions.SUBMISSION_REVIEW,
      };

      return knex('role_permission').insert(rolePermssion);
    })
    .then(() => {
      const roles = [Roles.OWNER, Roles.TEAM_MANAGER, Roles.FORM_DESIGNER, Roles.SUBMISSION_REVIEWER, Roles.FORM_SUBMITTER, Roles.SUBMISSION_APPROVER];
      knex('identity_provider').where({ code: 'idir' }).update({
        roles: roles,
      });
    })
    .then(() => {
      const roles = [Roles.TEAM_MANAGER, Roles.SUBMISSION_REVIEWER, Roles.FORM_SUBMITTER, Roles.SUBMISSION_APPROVER];
      knex('identity_provider').where({ code: 'bceid-business' }).update({
        roles: roles,
      });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve()
    .then(() => {
      const roles = [Roles.OWNER, Roles.TEAM_MANAGER, Roles.FORM_DESIGNER, Roles.SUBMISSION_REVIEWER, Roles.FORM_SUBMITTER];
      knex('identity_provider').where({ code: 'idir' }).update({
        roles: roles,
      });
    })
    .then(() => {
      const roles = [Roles.TEAM_MANAGER, Roles.SUBMISSION_REVIEWER, Roles.FORM_SUBMITTER];
      knex('identity_provider').where({ code: 'bceid-business' }).update({
        roles: roles,
      });
    })
    .then(() => {
      knex('role_permission')
        .where({
          createdBy: CREATED_BY,
        })
        .del();
    })
    .then(() => {
      knex('permission')
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
