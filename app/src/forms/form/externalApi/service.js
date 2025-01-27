const Problem = require('api-problem');

const uuid = require('uuid');
const { ExternalAPIStatuses } = require('../../common/constants');

const { ExternalAPI, ExternalAPIStatusCode, Form, AdminExternalAPI } = require('../../common/models');

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
    if (!data.endpointUrl || (data.endpointUrl && !(data.endpointUrl.startsWith('https://') || data.endpointUrl.startsWith('http://')))) {
      throw new Problem(422, `'endpointUrl' is required and must start with 'http://' or 'https://'`);
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

  _updateAllPreApproved: async (formId, data, trx) => {
    let result = 0;
    const form = await Form.query().findById(formId);
    const delimiter = '?';
    const baseUrl = data.endpointUrl.split(delimiter)[0];
    // check if there are matching api endpoints for the same ministry as our form that have been previously approved.
    const approvedApis = await AdminExternalAPI.query(trx)
      .where('endpointUrl', 'ilike', `${baseUrl}%`)
      .andWhere('ministry', form.ministry)
      .andWhere('code', ExternalAPIStatuses.APPROVED);
    if (approvedApis && approvedApis.length) {
      // ok, since we've already approved a matching api endpoint, make sure others on this form are approved too.
      result = await ExternalAPI.query(trx)
        .patch({ code: ExternalAPIStatuses.APPROVED })
        .where('endpointUrl', 'ilike', `${baseUrl}%`)
        .andWhere('formId', formId)
        .andWhere('code', ExternalAPIStatuses.SUBMITTED);
    }
    return result;
  },

  createExternalAPI: async (formId, data, currentUser) => {
    service.validateExternalAPI(data);

    data.id = uuid.v4();
    // always create as SUBMITTED.
    data.code = ExternalAPIStatuses.SUBMITTED;
    // ensure that new records don't send user tokens.
    service.checkAllowSendUserToken(data, false);
    let trx;
    try {
      trx = await ExternalAPI.startTransaction();
      await ExternalAPI.query(trx).insert({
        ...data,
        createdBy: currentUser.usernameIdp,
      });
      // any urls on this form pre-approved?
      await service._updateAllPreApproved(formId, data, trx);
      await trx.commit();
      return ExternalAPI.query().findById(data.id);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  updateExternalAPI: async (formId, externalAPIId, data, currentUser) => {
    service.validateExternalAPI(data);

    const existing = await ExternalAPI.query().modify('findByIdAndFormId', externalAPIId, formId).first().throwIfNotFound();

    // let's use a different method for the administrators to update status code and allow send user token
    // this method should not change the status code
    data.code = existing.code;
    if (existing.endpointUrl.split('?')[0] !== data.endpointUrl.split('?')[0]) {
      // url changed, so save as SUBMITTED.
      data.code = ExternalAPIStatuses.SUBMITTED;
    }
    service.checkAllowSendUserToken(data, existing.allowSendUserToken);
    let trx;
    try {
      trx = await ExternalAPI.startTransaction();
      await ExternalAPI.query(trx).modify('findByIdAndFormId', externalAPIId, formId).update({
        formId: formId,
        name: data.name,
        code: data.code,
        endpointUrl: data.endpointUrl,
        sendApiKey: data.sendApiKey,
        apiKeyHeader: data.apiKeyHeader,
        apiKey: data.apiKey,
        allowSendUserToken: data.allowSendUserToken,
        sendUserToken: data.sendUserToken,
        userTokenHeader: data.userTokenHeader,
        userTokenBearer: data.userTokenBearer,
        updatedBy: currentUser.usernameIdp,
      });
      // any urls on this form pre-approved?
      await service._updateAllPreApproved(formId, data, trx);
      await trx.commit();
      return ExternalAPI.query().findById(data.id);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
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
