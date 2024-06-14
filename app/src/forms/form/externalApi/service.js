const Problem = require('api-problem');

const { v4: uuidv4 } = require('uuid');
const { ExternalAPIStatuses } = require('../../common/constants');

const { ExternalAPI, ExternalAPIStatusCode } = require('../../common/models');

const { ENCRYPTION_ALGORITHMS } = require('../../../components/encryptionService');

const service = {
  // -----------------------------------------------------------------------------
  // External API
  // -----------------------------------------------------------------------------

  listExternalAPIs: (formId) => {
    return ExternalAPI.query().modify('filterFormId', formId);
  },

  listExternalAPIAlgorithms: () => {
    return Object.values(ENCRYPTION_ALGORITHMS).map((x) => ({
      code: x,
      display: x,
    }));
  },

  listExternalAPIStatusCodes: () => {
    return ExternalAPIStatusCode.query();
  },

  validateExternalAPI: (data) => {
    if (!data) {
      throw new Problem(422, `'externalAPI record' cannot be empty.`);
    }
    if (data.sendApiKey) {
      if (!data.apiKeyHeader || !data.apiKey) {
        throw new Problem(422, `'apiKeyHeader' and 'apiKey' are required when 'sendApiKey' is true.`);
      }
    }
    if (data.sendUserToken) {
      if (!data.userTokenHeader) {
        throw new Problem(422, `'userTokenHeader' is required when 'sendUserToken' is true.`);
      }
    }
    if (data.sendUserInfo) {
      if (data.userInfoEncrypted && !data.userInfoHeader) {
        throw new Problem(422, `'userInfoHeader' is required when 'sendUserInfo' and 'userInfoEncrypted' are true.`);
      }
      if (data.userInfoEncrypted) {
        if (!Object.values(ENCRYPTION_ALGORITHMS).includes(data.userInfoEncryptionAlgo)) {
          throw new Problem(422, `'${data.userInfoEncryptionAlgo}' is not a valid Encryption Algorithm.`);
        }
        if (!data.userInfoEncryptionKey) {
          throw new Problem(422, `'userInfoEncryptionKey' is required when 'userInfoEncrypted' is true.`);
        }
      }
    }
  },

  createExternalAPI: async (formId, data, currentUser) => {
    service.validateExternalAPI(data);

    let trx;
    try {
      trx = await ExternalAPI.startTransaction();
      data.id = uuidv4();
      // set status to SUBMITTED
      data.code = ExternalAPIStatuses.SUBMITTED;
      await ExternalAPI.query(trx).insert({
        ...data,
        createdBy: currentUser.usernameIdp,
      });

      await trx.commit();
      return ExternalAPI.query().findById(data.id);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  updateExternalAPI: async (formId, externalAPIId, data, currentUser) => {
    service.validateExternalAPI(data);

    let trx;
    try {
      const existing = await ExternalAPI.query().modify('findByIdAndFormId', externalAPIId, formId).first().throwIfNotFound();
      trx = await ExternalAPI.startTransaction();
      // let's use a different method for the administrators to update status code.
      // this method should not change the status code.
      data.code = existing.code;
      await ExternalAPI.query(trx)
        .modify('findByIdAndFormId', externalAPIId, formId)
        .update({
          ...data,
          updatedBy: currentUser.usernameIdp,
        });

      await trx.commit();
      return ExternalAPI.query().findById(externalAPIId);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  deleteExternalAPI: async (formId, externalAPIId) => {
    let trx;
    try {
      await ExternalAPI.query().modify('findByIdAndFormId', externalAPIId, formId).first().throwIfNotFound();
      trx = await ExternalAPI.startTransaction();
      await ExternalAPI.query().deleteById(externalAPIId);
      await trx.commit();
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },
};

module.exports = service;
