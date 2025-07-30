const Problem = require('api-problem');
const { v4: uuidv4 } = require('uuid');

const { CorsDomainRequest } = require('../common/models');

const approvalStatusService = require('../approvalStatus/service');

const { ApprovalStatusCodes } = require('../common/constants');

const service = {
  listCorsDomainRequests: async (params) => {
    return CorsDomainRequest.query()
      .modify('filterFormId', params.formId)
      .modify('filterDomain', params.domain)
      .modify('filterStatusCode', params.statusCode)
      .modify('orderDescending');
  },

  createCorsDomainRequest: async (data, currentUser) => {
    let trx;
    try {
      trx = await CorsDomainRequest.startTransaction();

      const obj = {
        id: uuidv4(),
        formId: data.formId,
        domain: data.domain,
        statusCode: ApprovalStatusCodes.REQUESTED,
        createdBy: currentUser.usernameIdp,
      };
      await CorsDomainRequest.query().insert(obj);

      await approvalStatusService.createApprovalStatusHistory({
        entityType: CorsDomainRequest.tableName,
        entityId: obj.id,
        statusCode: obj.statusCode,
        createdBy: obj.createdBy,
      });

      await trx.commit();

      const result = await service.readCorsDomainRequest(obj.id);

      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  readCorsDomainRequest: async (id) => {
    return CorsDomainRequest.query().findById(id);
  },

  deleteCorsDomainRequest: async (id) => {
    return CorsDomainRequest.query().deleteById(id);
  },
};

module.exports = service;
