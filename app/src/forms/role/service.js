const { Role } = require('../common/models');

const {transaction} = require('objection');
const {v4: uuidv4} = require('uuid');

const service = {

  list: async () => {
    return Role.query()
      .allowGraph('[permissions]')
      .withGraphFetched('permissions(orderNameAscending)')
      .modify('orderNameAscending');
  },

  create: async (data) => {
    let trx;
    try {
      trx = await transaction.start(Role.knex());

      const obj = {};
      obj.id = uuidv4();
      obj.name = data.name; // validate unique...
      obj.description = data.description;

      await Role.query(trx).insert(obj);
      await trx.commit();
      const result = await service.read(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  read: async (id) => {
    return Role.query()
      .findById(id)
      .allowGraph('[permissions]')
      .withGraphFetched('permissions(orderNameAscending)')
      .throwIfNotFound();
  },

  update: async (id, data) => {
    let trx;
    try {
      const obj = await service.read(id);
      await transaction(Role.knex(), async (trx) => {
        if (obj.name !== data.name || obj.description != data.description) {
          // update name/description...
          await Role.query().patchAndFetchById(obj.id, {name: data.name, description: data.description});
        }
        // clean out existing permissions...
        await trx.raw(`delete from role_permission where "roleId" = '${obj.id}'`);
        // set to specified permissions...
        for (const p of data.permissions) {
          await trx.raw(`insert into role_permission (id, "roleId", "permissionId") values ('${uuidv4()}', '${obj.id}', '${p.id}');`);
        }
      });
      const result = await service.read(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  }

};

module.exports = service;
