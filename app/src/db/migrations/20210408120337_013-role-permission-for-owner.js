const { v4: uuidv4 } = require('uuid');

const CREATED_BY = 'migration-013';

exports.up = function (knex) {
  return Promise.resolve()
    // Allow form owners to do all the other roles' actions
    .then(() => {
      const rolePermssion = {
        id: uuidv4(),
        createdBy: CREATED_BY,
        role: 'owner',
        permission: 'design_create'
      };
      return knex('role_permission').insert(rolePermssion);
    })

    .then(() => {
      const rolePermssion = {
        id: uuidv4(),
        createdBy: CREATED_BY,
        role: 'owner',
        permission: 'design_delete'
      };
      return knex('role_permission').insert(rolePermssion);
    })

    .then(() => {
      const rolePermssion = {
        id: uuidv4(),
        createdBy: CREATED_BY,
        role: 'owner',
        permission: 'design_read'
      };
      return knex('role_permission').insert(rolePermssion);
    })

    .then(() => {
      const rolePermssion = {
        id: uuidv4(),
        createdBy: CREATED_BY,
        role: 'owner',
        permission: 'design_update'
      };
      return knex('role_permission').insert(rolePermssion);
    })

    .then(() => {
      const rolePermssion = {
        id: uuidv4(),
        createdBy: CREATED_BY,
        role: 'owner',
        permission: 'submission_create'
      };
      return knex('role_permission').insert(rolePermssion);
    })

    .then(() => {
      const rolePermssion = {
        id: uuidv4(),
        createdBy: CREATED_BY,
        role: 'owner',
        permission: 'submission_delete'
      };
      return knex('role_permission').insert(rolePermssion);
    })

    .then(() => {
      const rolePermssion = {
        id: uuidv4(),
        createdBy: CREATED_BY,
        role: 'owner',
        permission: 'submission_read'
      };
      return knex('role_permission').insert(rolePermssion);
    })

    .then(() => {
      const rolePermssion = {
        id: uuidv4(),
        createdBy: CREATED_BY,
        role: 'owner',
        permission: 'submission_update'
      };
      return knex('role_permission').insert(rolePermssion);
    })

    .then(() => {
      const rolePermssion = {
        id: uuidv4(),
        createdBy: CREATED_BY,
        role: 'owner',
        permission: 'team_read'
      };
      return knex('role_permission').insert(rolePermssion);
    })

    .then(() => {
      const rolePermssion = {
        id: uuidv4(),
        createdBy: CREATED_BY,
        role: 'owner',
        permission: 'team_update'
      };
      return knex('role_permission').insert(rolePermssion);
    });

};

exports.down = function (knex) {
  return Promise.resolve()
    // undo new form role permission
    .then(() => knex('role_permission')
      .where({
        createdBy: CREATED_BY
      })
      .del());
};
