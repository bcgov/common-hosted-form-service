const uuid = require('uuid');

const { Permissions, Roles } = require('../../forms/common/constants');

const CREATED_BY = 'migration-047';
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return Promise.resolve().then(() => {
        const rolePermission = {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          role: Roles.FORM_SUBMITTER,
          permission: Permissions.DOCUMENT_TEMPLATE_READ,
        };
        return knex('role_permission').insert(rolePermission);
      });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return Promise.resolve().then(() =>
        knex('role_permission')
            .where({
                createdBy: CREATED_BY,
            })
            .del()
    );  
};
