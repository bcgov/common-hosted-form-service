const Problem = require('api-problem');
const { v4: uuidv4 } = require('uuid');

const { CorsOriginRequest } = require('../common/models');

const approvalStatusService = require('../approvalStatus/service');

const { ApprovalStatusCodes } = require('../common/constants');

const service = {
  listCorsOriginRequests: async (params) => {
    return CorsOriginRequest.query()
      .modify('filterFormId', params.formId)
      .modify('filterOrigin', params.origin)
      .modify('filterStatusCode', params.statusCode)
      .modify('orderDescending');
  },

  createCorsOriginRequest: async (data, currentUser) => {
    let trx;
    try {
      trx = await CorsOriginRequest.startTransaction();

      const obj = {
        id: uuidv4(),
        formId: data.formId,
        origin: data.origin,
        statusCode: ApprovalStatusCodes.REQUESTED,
        createdBy: currentUser.usernameIdp,
      };
      await CorsOriginRequest.query().insert(obj);

      await approvalStatusService.createApprovalStatusHistory(
        {
          entityType: CorsOriginRequest.tableName,
          entityId: obj.id,
          statusCode: obj.statusCode,
        },
        currentUser
      );

      await trx.commit();

      const result = await service.readCorsOriginRequest(obj.id);

      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  readCorsOriginRequest: async (id) => {
    return CorsOriginRequest.query().findById(id);
  },

  updateCorsOriginRequest: async (id, data, currentUser) => {
    let trx;
    try {
      trx = await CorsOriginRequest.startTransaction();

      const obj = await service.readCorsOriginRequest(id);

      await approvalStatusService.createApprovalStatusHistory(
        {
          entityType: CorsOriginRequest.tableName,
          entityId: obj.id,
          statusCode: ApprovalStatusCodes.PENDING,
        },
        currentUser
      );

      await CorsOriginRequest.query(trx).patchAndFetchById(id, {
        statusCode: data.statusCode,
      });

      await trx.commit();
      return service.readCorsOriginRequest(id);
    } catch (error) {
      if (trx) await trx.rollback();
      throw error;
    }
  },

  deleteCorsOriginRequest: async (id) => {
    return CorsOriginRequest.query().deleteById(id);
  },

  getCurrentUserCorsOriginRequests: async (currentUser, params = {}) => {
    if (!currentUser) return [];
    try {
      return CorsOriginRequest.query()
        .modify('filterFormId', params.formId)
        .modify('filterOrigin', params.origin)
        .modify('filterStatusCode', params.statusCode)
        .modify('filterCreatedBy', currentUser.usernameIdp)
        .modify('orderDescending');
    } catch {
      return [];
    }
  },

  createCurrentUserCorsOriginRequest: async (data, currentUser) => {
    if (!currentUser) {
      throw new Problem(401, {
        detail: 'Unauthorized to create CORS domain request',
      });
    }
    if (!data || !data.formId || !data.origin) {
      throw new Problem(400, {
        detail: 'formId and domain are required to create a CORS domain request',
      });
    }
    data.createdBy = currentUser.usernameIdp;
    return service.createCorsOriginRequest(data, currentUser);
  },

  updateCurrentUserCorsOriginRequest: async (id, data, currentUser) => {
    if (!currentUser) {
      throw new Problem(401, {
        detail: 'Unauthorized to update CORS domain request',
      });
    }
    if (!data || !data.formId || !data.origin) {
      throw new Problem(400, {
        detail: 'formId and domain are required to update a CORS domain request',
      });
    }
    let trx;
    try {
      trx = await CorsOriginRequest.startTransaction();

      const obj = await service.readCorsOriginRequest(id);
      if (!obj || obj.createdBy !== currentUser.usernameIdp) {
        throw new Problem(404, {
          detail: 'CorsOriginRequest does not exist for this user',
        });
      }

      await approvalStatusService.createApprovalStatusHistory(
        {
          entityType: CorsOriginRequest.tableName,
          entityId: obj.id,
          statusCode: ApprovalStatusCodes.REQUESTED,
        },
        currentUser
      );

      await CorsOriginRequest.query(trx).patchAndFetchById(id, {
        origin: data.origin,
        statusCode: ApprovalStatusCodes.REQUESTED,
      });

      await trx.commit();
      return service.readCorsOriginRequest(id);
    } catch (error) {
      if (trx) await trx.rollback();
      throw error;
    }
  },

  deleteCurrentUserCorsOriginRequest: async (id, currentUser) => {
    const CorsOriginRequest = await service.readCorsOriginRequest(id);
    if (!CorsOriginRequest || CorsOriginRequest.createdBy !== currentUser.usernameIdp) {
      throw new Problem(404, {
        detail: 'CorsOriginRequest does not exist for this user',
      });
    }
    return service.deleteCorsOriginRequest(id);
  },
};

module.exports = service;
