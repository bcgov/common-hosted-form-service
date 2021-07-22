const { v4: uuidv4 } = require('uuid');

const CREATED_BY = 'migration-019';

exports.up = function (knex) {
  return Promise.resolve()
    // Add the new permissions for users managing Form API Keys
    .then(() => {
      const items = [
        {
          createdBy: CREATED_BY,
          code: 'form_api_create',
          display: 'API Key Create',
          description: 'Can create an api key for a form',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'form_api_read',
          display: 'API Key Read',
          description: 'Can view the API key for a form (unencrypted)',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'form_api_update',
          display: 'API Key Update',
          description: 'Can update the API key for a form',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'form_api_delete',
          display: 'API Key Delete',
          description: 'Can remove the API key from a form',
          active: true
        }
      ];
      return knex('permission').insert(items).returning('code');
    })

    // Form Owners (and only owners now) can do these new permissions
    .then(() => {
      const rolePermssion = {
        id: uuidv4(),
        createdBy: CREATED_BY,
        role: 'owner',
        permission: 'form_api_create'
      };
      return knex('role_permission').insert(rolePermssion);
    })

    .then(() => {
      const rolePermssion = {
        id: uuidv4(),
        createdBy: CREATED_BY,
        role: 'owner',
        permission: 'form_api_read'
      };
      return knex('role_permission').insert(rolePermssion);
    })

    .then(() => {
      const rolePermssion = {
        id: uuidv4(),
        createdBy: CREATED_BY,
        role: 'owner',
        permission: 'form_api_update'
      };
      return knex('role_permission').insert(rolePermssion);
    })

    .then(() => {
      const rolePermssion = {
        id: uuidv4(),
        createdBy: CREATED_BY,
        role: 'owner',
        permission: 'form_api_delete'
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
      .del())

    // undo new permissions
    .then(() => knex('permission')
      .where({
        createdBy: CREATED_BY
      })
      .del());
};
