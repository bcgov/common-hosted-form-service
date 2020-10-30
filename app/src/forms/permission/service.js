const { Permission } = require('../common/models');

const {transaction} = require('objection');
const {v4: uuidv4} = require('uuid');

const service = {
  list: async () => {
    return Permission.query()
      .allowGraph('[roles]')
      .withGraphFetched('roles(orderDefault)')
      .modify('orderDefault');
  },

  create: async (data, currentUser) => {
    let trx;
    try {
      trx = await transaction.start(Permission.knex());


      // TODO: validate permission code is unique
      data.createdBy = currentUser.username;

      await Permission.query(trx).insert(data);
      await trx.commit();
      const result = await service.read(data.code);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  read: async (code) => {
    return Permission.query()
      .findOne('code', code)
      .allowGraph('[roles]')
      .withGraphFetched('roles(orderDefault)')
      .throwIfNotFound();
  },

  update: async (code, data, currentUser) => {
    let trx;
    try {
      const obj = await service.read(code);
      await transaction(Permission.knex(), async (trx) => {
        if (obj.display !== data.display || obj.description != data.description || obj.active != obj.active) {
          // update name/description...
          await Permission.query().patchAndFetchById(obj.code, {display: data.display, description: data.description, active: data.active, updatedBy: currentUser.username});
        }
        // clean out existing roles...
        await trx.raw(`delete from role_permission where "permission" = '${obj.code}'`);
        // set to specified roles...
        for (const r of data.roles) {
          await trx.raw(`insert into role_permission (id, "role", "permission", "createdBy") values ('${uuidv4()}', '${r.code}', '${obj.code}', '${currentUser.username}');`);
        }
      });
      const result = await service.read(obj.code);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  }

};

module.exports = service;
