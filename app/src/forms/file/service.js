const { FileStorage } = require('../common/models');
const {transaction} = require('objection');
const {v4: uuidv4} = require('uuid');

const service = {

  create: async (data, currentUser) => {
    let trx;
    try {
      trx = await transaction.start(FileStorage.knex());

      const obj = {};
      obj.id = uuidv4();
      obj.storage = 'uploads';
      obj.originalName = data.originalname;
      obj.mimeType = data.mimetype;
      obj.size = data.size;
      obj.path = data.path;
      obj.createdBy = currentUser.username;

      await FileStorage.query(trx).insert(obj);
      await trx.commit();
      const result = await service.read(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  read: async (id) => {
    return FileStorage.query()
      .findById(id)
      .throwIfNotFound();
  },

  delete: async (id) => {
    return FileStorage.query()
      .deleteById(id)
      .throwIfNotFound();
  }

};

module.exports = service;
