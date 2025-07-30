const Problem = require('api-problem');
const { v4: uuidv4 } = require('uuid');

const { ApprovalStatusCode, ApprovalStatusHistory } = require('../common/models');

const service = {
  listApprovalStatusCodes: async () => {
    return ApprovalStatusCode.query().orderBy('code');
  },

  createApprovalStatusCode: async (data, currentUser) => {
    const obj = {
      code: data.code,
      display: data.display,
      createdBy: currentUser.usernameIdp,
    };
    return ApprovalStatusCode.query().insert(obj);
  },

  readApprovalStatusCode: async (code) => {
    return ApprovalStatusCode.query().findById(code);
  },

  updateApprovalStatusCode: async (code, data, currentUser) => {
    const obj = await service.readApprovalStatusCode(code);
    if (!obj) {
      throw new Problem(404, `Approval status code with code ${code} not found.`);
    }
    return ApprovalStatusCode.query().patchAndFetchById(code, {
      ...data,
      updatedBy: currentUser.usernameIdp,
    });
  },

  deleteApprovalStatusCode: async (code) => {
    const count = await ApprovalStatusCode.query().deleteById(code);
    if (count === 0) {
      throw new Problem(404, `Approval status code with code ${code} not found.`);
    }
  },

  listApprovalStatusHistory: async (params) => {
    return ApprovalStatusHistory.query()
      .modify('filterEntityType', params.entityType)
      .modify('filterEntityId', params.entityId)
      .modify('filterStatusCode', params.statusCode)
      .modify('orderDescending');
  },

  createApprovalStatusHistory: async (data, currentUser) => {
    const obj = {
      id: uuidv4(),
      entityType: data.entityType,
      entityId: data.entityId,
      statusCode: data.statusCode,
      comment: data.comment,
      createdBy: currentUser.usernameIdp,
    };
    return ApprovalStatusHistory.query().insert(obj);
  },

  readApprovalStatusHistory: async (id) => {
    return ApprovalStatusHistory.query().findById(id);
  },

  updateApprovalStatusHistory: async (id, data, currentUser) => {
    const obj = await service.readApprovalStatusHistory(id);
    if (!obj) {
      throw new Problem(404, `Approval status history with id ${id} not found.`);
    }
    return ApprovalStatusHistory.query().patchAndFetchById(id, {
      ...data,
      updatedBy: currentUser.usernameIdp,
    });
  },

  deleteApprovalStatusHistory: async (id) => {
    const count = await ApprovalStatusHistory.query().deleteById(id);
    if (count === 0) {
      throw new Problem(404, `Approval status history with id ${id} not found.`);
    }
  },
};

module.exports = service;
