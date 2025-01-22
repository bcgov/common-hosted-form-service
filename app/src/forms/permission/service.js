const uuid = require('uuid');
const { Permissions } = require('../common/constants');
const { FormSubmissionUser, Permission } = require('../common/models');

const service = {
  list: async () => {
    return Permission.query().allowGraph('[roles]').withGraphFetched('roles(orderDefault)').modify('orderDefault');
  },

  create: async (data, currentUser) => {
    let trx;
    try {
      trx = await Permission.startTransaction();

      // TODO: validate permission code is unique
      data.createdBy = currentUser.usernameIdp;

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
    return Permission.query().findOne('code', code).allowGraph('[roles]').withGraphFetched('roles(orderDefault)').throwIfNotFound();
  },

  update: async (code, data, currentUser) => {
    let trx;
    try {
      const obj = await service.read(code);
      trx = await Permission.startTransaction();
      if (obj.display !== data.display || obj.description != data.description || obj.active != obj.active) {
        // update name/description...
        await Permission.query(trx).patchAndFetchById(obj.code, {
          display: data.display,
          description: data.description,
          active: data.active,
          updatedBy: currentUser.usernameIdp,
        });
      }
      // clean out existing roles...
      await trx.raw(`delete from role_permission where "permission" = '${obj.code}'`);
      // set to specified roles...
      for (const r of data.roles) {
        await trx.raw(`insert into role_permission (id, "role", "permission", "createdBy") values ('${uuid.v4()}', '${r.code}', '${obj.code}', '${currentUser.usernameIdp}');`);
      }
      await trx.commit();

      return await service.read(obj.code);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  /**
   * @function setUserEditable
   * Adds editing permissions for all existing submitter users
   * @param {string} submissionId The submission uuid
   * @param {object} currentUser The currently logged in user metadata
   * @param {object} [etrx=undefined] An optional Objection Transaction object
   * @returns {object} The result of running the insert operation
   * @throws The error encountered upon db transaction failure
   */
  setUserEditable: async (submissionId, currentUser, etrx = undefined) => {
    let trx;
    try {
      trx = etrx ? etrx : await FormSubmissionUser.startTransaction();

      // DANGER - do not mess up the where clauses!
      // ALWAYS ensure submissionid is enforced and you know what KNEX is doing about chaining the where clauses as to if it's making an AND or an OR
      const users = await FormSubmissionUser.query().select('userId').where('formSubmissionId', submissionId).whereIn('permission', [Permissions.SUBMISSION_READ]);

      const itemsToInsert = users.map((user) => ({
        id: uuid.v4(),
        userId: user.userId,
        formSubmissionId: submissionId,
        permission: Permissions.SUBMISSION_UPDATE,
        createdBy: currentUser.usernameIdp,
      }));

      let result = undefined;
      if (itemsToInsert && itemsToInsert.length) result = await FormSubmissionUser.query(trx).insert(itemsToInsert);

      if (!etrx) await trx.commit();
      return result;
    } catch (err) {
      if (!etrx && trx) await trx.rollback();
      throw err;
    }
  },

  /**
   * @function setUserReadOnly
   * Drops editing and deletion permissions for all submitter users
   * @param {string} submissionId The submission id
   * @param {object} [etrx=undefined] An optional Objection Transaction object
   * @returns {object} The result of running the delete operation
   * @throws The error encountered upon db transaction failure
   */
  setUserReadOnly: async (submissionId, etrx = undefined) => {
    let trx;
    try {
      trx = etrx ? etrx : await FormSubmissionUser.startTransaction();

      // DANGER - do not mess up the where clauses!
      // ALWAYS ensure submissionid is enforced and you know what KNEX is doing about chaining the where clauses as to if it's making an AND or an OR
      const result = await FormSubmissionUser.query(trx)
        .delete()
        .where('formSubmissionId', submissionId)
        .whereIn('permission', [Permissions.SUBMISSION_DELETE, Permissions.SUBMISSION_UPDATE]);

      if (!etrx) await trx.commit();
      return result;
    } catch (err) {
      if (!etrx && trx) await trx.rollback();
      throw err;
    }
  },
};

module.exports = service;
