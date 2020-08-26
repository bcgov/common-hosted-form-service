const { Permission } = require('../common/models');

const {transaction} = require('objection');
const {v4: uuidv4} = require('uuid');

const service = {
  list: async () => {
    return Permission.query()
      .allowGraph('[roles]')
      .withGraphFetched('roles(orderNameAscending)')
      .modify('orderNameAscending');
  },

  create: async (data) => {
    let trx;
    try {
      trx = await transaction.start(Permission.knex());

      const obj = {};
      obj.id = uuidv4();
      obj.name = data.name; // validate unique...
      obj.description = data.description;

      await Permission.query(trx).insert(obj);
      await trx.commit();
      const result = await service.read(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  read: async (id) => {
    return Permission.query()
      .findById(id)
      .allowGraph('[roles]')
      .withGraphFetched('roles(orderNameAscending)')
      .throwIfNotFound();
  },

  update: async (id, data) => {
    let trx;
    try {
      const obj = await service.read(id);
      await transaction(Permission.knex(), async (trx) => {
        if (obj.name !== data.name || obj.description != data.description) {
          // update name/description...
          await Permission.query().patchAndFetchById(obj.id, {name: data.name, description: data.description});
        }
        // clean out existing roles...
        await trx.raw(`delete from role_permission where "permissionId" = '${obj.id}'`);
        // set to specified roles...
        for (const r of data.roles) {
          await trx.raw(`insert into role_permission (id, "roleId", "permissionId") values ('${uuidv4()}', '${r.id}', '${obj.id}');`);
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
