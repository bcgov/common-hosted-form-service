const uuid = require('uuid');
const { Role } = require('../common/models');

const service = {
  list: async () => {
    return Role.query().allowGraph('[permissions]').withGraphFetched('permissions(orderDefault)').modify('orderDefault');
  },

  create: async (data, currentUser) => {
    let trx;
    try {
      trx = await Role.startTransaction();

      // TODO: validate role code is unique
      data.createdBy = currentUser.usernameIdp;

      await Role.query(trx).insert(data);
      await trx.commit();
      const result = await service.read(data.code);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  read: async (code) => {
    return Role.query().findOne('code', code).allowGraph('[permissions]').withGraphFetched('permissions(orderDefault)').throwIfNotFound();
  },

  update: async (code, data, currentUser) => {
    let trx;
    try {
      const obj = await service.read(code);
      trx = await Role.startTransaction();

      if (obj.display !== data.display || obj.description != data.description || obj.active != data.active) {
        // update name/description...
        await Role.query(trx).patchAndFetchById(obj.code, {
          display: data.display,
          description: data.description,
          active: data.active,
          updatedBy: currentUser.usernameIdp,
        });
      }
      // clean out existing permissions...
      await trx.raw(`delete from role_permission where "role" = '${obj.code}'`);
      // set to specified permissions...
      for (const p of data.permissions) {
        await trx.raw(`insert into role_permission (id, "role", "permission", "createdBy") values ('${uuid.v4()}', '${obj.code}', '${p.code}', '${currentUser.usernameIdp}');`);
      }

      await trx.commit();
      return await service.read(obj.code);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },
};

module.exports = service;
