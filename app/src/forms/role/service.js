const { Role } = require('../common/models');

const service = {
  list: async () => {
    return Role.query().allowGraph('[permissions]').withGraphFetched('permissions(orderDefault)').modify('orderDefault');
  },

  read: async (code) => {
    return Role.query().findOne('code', code).allowGraph('[permissions]').withGraphFetched('permissions(orderDefault)').throwIfNotFound();
  },
};

module.exports = service;
