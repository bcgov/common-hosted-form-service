const { Role } = require('../common/models');

const service = {
  list: async () => {
    return Role.query()
      .modify('classicOnly') // only classic roles
      .allowGraph('[permissions]')
      .withGraphFetched('permissions(orderDefault)')
      .modify('orderDefault');
  },

  read: async (code) => {
    return Role.query()
      .modify('classicOnly') // only classic roles
      .findOne('code', code)
      .allowGraph('[permissions]')
      .withGraphFetched('permissions(orderDefault)')
      .throwIfNotFound();
  },
};

module.exports = service;
