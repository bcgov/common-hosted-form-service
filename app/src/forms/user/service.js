const Problem = require('api-problem');
const uuid = require('uuid');
const { User, UserFormPreferences, Label } = require('../common/models');
const idpService = require('../../components/idpService');

const service = {
  //
  // User
  //
  list: (params) => {
    try {
      // returns a promise, so caller needs to await.
      return idpService.userSearch(params);
    } catch (e) {
      throw new Problem(422, {
        detail: e.message,
      });
    }
  },

  read: (userId) => {
    return User.query().findById(userId).throwIfNotFound();
  },

  readSafe: (userId) => {
    return User.query().modify('safeSelect').findById(userId).throwIfNotFound();
  },

  //
  // User Labels
  //
  readUserLabels: (currentUser) => {
    return Label.query().where('userId', currentUser.id).select('labelText');
  },

  updateUserLabels: async (currentUser, body) => {
    let trx;
    try {
      if (!body || !Array.isArray(body)) {
        throw new Problem(422, {
          detail: 'Could not update user labels. Invalid options provided',
        });
      }
      trx = await Label.startTransaction();
      for (const labelText of body) {
        const existingLabel = await Label.query()
          .where({
            userId: currentUser.id,
            labelText: labelText,
          })
          .first();

        if (!existingLabel) {
          await Label.query(trx).insert({
            id: uuid.v4(),
            userId: currentUser.id,
            labelText: labelText,
          });
        }
      }
      await trx.commit();
      return service.readUserLabels(currentUser);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  //
  // User Preferences
  //
  deleteUserPreferences: (currentUser) => {
    return UserFormPreferences.query().delete().where('userId', currentUser.id).throwIfNotFound();
  },

  readUserPreferences: (currentUser) => {
    return UserFormPreferences.query().where('userId', currentUser.id);
  },

  updateUserPreferences: async (currentUser, body) => {
    let trx;
    try {
      if (!body || !body.forms || !Array.isArray(body.forms)) {
        throw new Problem(422, {
          detail: 'Could not update user preferences. Invalid options provided',
        });
      }

      trx = await UserFormPreferences.startTransaction();

      body.forms.forEach(async (form) => {
        const current = await service.readUserFormPreferences(currentUser, form.formId);

        if (current) {
          await UserFormPreferences.query(trx).patchAndFetchById([currentUser.id, form.formId], {
            preferences: form.preferences,
            updatedBy: currentUser.usernameIdp,
          });
        } else {
          await UserFormPreferences.query(trx).insert({
            userId: currentUser.id,
            formId: form.formId,
            preferences: form.preferences,
            createdBy: currentUser.usernameIdp,
          });
        }
      });

      await trx.commit();
      return service.readUserPreferences(currentUser);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  //
  // User Form Preferences
  //
  deleteUserFormPreferences: (currentUser, formId) => {
    return UserFormPreferences.query().deleteById([currentUser.id, formId]).throwIfNotFound();
  },

  readUserFormPreferences: (currentUser, formId) => {
    return UserFormPreferences.query().findById([currentUser.id, formId]).first();
  },

  updateUserFormPreferences: async (currentUser, formId, preferences) => {
    let trx;
    try {
      let result;

      const current = await service.readUserFormPreferences(currentUser, formId);
      trx = await UserFormPreferences.startTransaction();

      if (current) {
        result = await UserFormPreferences.query(trx).patchAndFetchById([currentUser.id, formId], {
          preferences: preferences,
          updatedBy: currentUser.usernameIdp,
        });
      } else {
        result = await UserFormPreferences.query(trx).insertAndFetch({
          userId: currentUser.id,
          formId: formId,
          preferences: preferences,
          createdBy: currentUser.usernameIdp,
        });
      }

      await trx.commit();
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },
};

module.exports = service;
