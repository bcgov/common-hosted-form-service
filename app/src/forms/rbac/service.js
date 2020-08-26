const { FormRoleUser} = require('../common/models');

const {transaction} = require('objection');
const {v4: uuidv4} = require('uuid');

const service = {

  list: async () => {
    return FormRoleUser.query()
      .allowGraph('[form, role, user]')
      .withGraphFetched('[form, role, user]')
      .modify('orderCreatedAtDescending');
  },

  create: async (data) => {
    let trx;
    try {
      trx = await transaction.start(FormRoleUser.knex());

      const obj = Object.assign({}, data);
      obj.id = uuidv4();

      await FormRoleUser.query(trx).insert(obj);
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
      trx = await transaction.start(FormRoleUser.knex());

      const update = {
        formId: data.formId,
        roleId: data.roleId,
        userId: data.userId};

      await FormRoleUser.query(trx).patchAndFetchById(obj.id, update);
      await trx.commit();
      const result = await service.read(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  read: async (id) => {
    return FormRoleUser.query()
      .findById(id)
      .allowGraph('[form, role, user]')
      .withGraphFetched('[form, role, user]')
      .throwIfNotFound();
  },

  delete: async (id) => {
    return FormRoleUser.query()
      .deleteById(id)
      .throwIfNotFound();
  }

};

module.exports = service;
