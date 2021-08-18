const { User, UserFormPreferences } = require('../common/models');

const service = {
  list: (params) => {
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

  read: (userId) => {
    return User.query()
      .findById(userId)
      .throwIfNotFound();
  },

  deleteUserFormPreferences: (currentUser, formId) => {
    return UserFormPreferences.query()
      .deleteById([currentUser.id, formId])
      .throwIfNotFound();
  },

  readUserFormPreferences: (currentUser, formId) => {
    return UserFormPreferences.query()
      .findById([currentUser.id, formId])
      .first();
  },

  updateUserFormPreferences: async (currentUser, formId, preferences) => {
    let trx;
    try {
      let result;

      const current = await service.readUserFormPreferences(currentUser, formId);
      trx = await UserFormPreferences.startTransaction();

      if (current) {
        result = await UserFormPreferences.query(trx)
          .patchAndFetchById([currentUser.id, formId], {
            preferences: preferences,
            updatedBy: currentUser.username
          });
      } else {
        result = await UserFormPreferences.query(trx)
          .insertAndFetch({
            userId: currentUser.id,
            formId: formId,
            preferences: preferences,
            createdBy: currentUser.username
          });
      }

      await trx.commit();
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  }
};

module.exports = service;
