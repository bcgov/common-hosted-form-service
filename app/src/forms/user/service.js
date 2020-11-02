const { User } = require('../common/models');

const service = {

  list: async (params) => {
    return User.query()
      .skipUndefined()
      .modify('filterKeycloakId', params.keycloakId)
      .modify('filterUsername', params.username)
      .modify('filterFullName', params.fullName)
      .modify('filterFirstName', params.firstName)
      .modify('filterLastName', params.lastName)
      .modify('filterEmail', params.email)
      .modify('filterSearch', params.search)
      .modify('orderLastFirstAscending');
  },

  read: async (userId) => {
    return User.query()
      .findById(userId)
      .throwIfNotFound();
  }

};

module.exports = service;
