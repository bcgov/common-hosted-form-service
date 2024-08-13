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
  },

  checkAllowSendUserToken: (data, allowSendUserToken) => {
    if (!data) {
      throw new Problem(422, `'externalAPI record' cannot be empty.`);
    }

    if (data.sendUserToken && !allowSendUserToken) {
      throw new Problem(422, 'Sending User Token has not been authorized for this External API.');
    }
    if (!allowSendUserToken) {
      // make sure all user token fields are cleared out...
      data.allowSendUserToken = false;
      data.sendUserToken = false;
      data.userTokenHeader = null;
      data.userTokenBearer = false;
    }
  },

  createExternalAPI: async (formId, data, currentUser) => {
    service.validateExternalAPI(data);

    data.id = uuidv4();
    // set status to SUBMITTED
    data.code = ExternalAPIStatuses.SUBMITTED;
    // ensure that new records don't send user tokens.
    service.checkAllowSendUserToken(data, false);
    await ExternalAPI.query().insert({
      ...data,
      createdBy: currentUser.usernameIdp,
    });

    return ExternalAPI.query().findById(data.id);
  },

  updateExternalAPI: async (formId, externalAPIId, data, currentUser) => {
    service.validateExternalAPI(data);

    const existing = await ExternalAPI.query().modify('findByIdAndFormId', externalAPIId, formId).first().throwIfNotFound();

    // let's use a different method for the administrators to update status code and allow send user token
    // this method should not change the status code.
    data.code = existing.code;
    service.checkAllowSendUserToken(data, existing.allowSendUserToken);
    await ExternalAPI.query()
      .modify('findByIdAndFormId', externalAPIId, formId)
      .update({
        ...data,
        updatedBy: currentUser.usernameIdp,
      });

    return ExternalAPI.query().findById(externalAPIId);
  },

  deleteExternalAPI: async (formId, externalAPIId) => {
    await ExternalAPI.query().modify('findByIdAndFormId', externalAPIId, formId).first().throwIfNotFound();
    await ExternalAPI.query().deleteById(externalAPIId);
  },

  readExternalAPI: (externalAPIId) => {
    return ExternalAPI.query().findById(externalAPIId);
  },
};

module.exports = service;
