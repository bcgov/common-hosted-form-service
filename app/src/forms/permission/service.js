const uuid = require('uuid');
const { Permissions } = require('../common/constants');
const { FormSubmissionUser, Permission } = require('../common/models');

const service = {
  list: async () => {
    return Permission.query().allowGraph('[roles]').withGraphFetched('roles(orderDefault)').modify('orderDefault');
  },

  read: async (code) => {
    return Permission.query().findOne('code', code).allowGraph('[roles]').withGraphFetched('roles(orderDefault)').throwIfNotFound();
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
