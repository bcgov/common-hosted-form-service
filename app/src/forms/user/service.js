const { User} = require('../common/models');

const {transaction} = require('objection');
const {v4: uuidv4} = require('uuid');

const service = {

  list: async () => {
    return User.query()
      .modify('orderLastFirstAscending');
  },

  create: async (data) => {
    let trx;
    try {
      trx = await transaction.start(User.knex());

      const obj = Object.assign({}, data);
      obj.id = uuidv4();

      await User.query(trx).insert(obj);
      await trx.commit();
      const result = await service.read(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  update: async (id, data) => {
    let trx;
    try {
      const obj = await service.read(id);
      trx = await transaction.start(User.knex());

      const update = {
        keycloakId: data.keycloakId,
        username: data.username,
        fullName: data.fullName,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName};

      await User.query(trx).patchAndFetchById(obj.id, update);
      await trx.commit();
      const result = await service.read(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  read: async (id) => {
    return User.query()
      .findById(id)
      .throwIfNotFound();
  }

};

module.exports = service;
