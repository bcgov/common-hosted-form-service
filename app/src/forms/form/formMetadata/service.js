const Problem = require('api-problem');

const { v4: uuidv4 } = require('uuid');

const { FormMetadata } = require('../../common/models');

const DEFAULT_HEADERNAME = 'X-FORM-METADATA';
const DEFAULT_ATTRIBUTENAME = 'formMetadata';

const service = {
  validate: (data) => {
    if (!data) {
      throw new Problem(422, `'formMetadata record' cannot be empty.`);
    }
  },

  initModel: (formId, data) => {
    return {
      id: uuidv4(),
      formId: formId,
      headerName: data.headerName ? data.headerName : DEFAULT_HEADERNAME,
      attributeName: data.attributeName ? data.attributeName : DEFAULT_ATTRIBUTENAME,
      metadata: data.metadata ? data.metadata : {},
    };
  },

  create: async (formId, data, currentUser) => {
    return service.upsert(formId, data, currentUser);
  },

  read: async (formId) => {
    return FormMetadata.query().modify('filterFormId', formId).first();
  },

  update: async (formId, data, currentUser) => {
    return service.upsert(formId, data, currentUser);
  },

  delete: async (formId) => {
    const existing = await FormMetadata.query().modify('filterFormId', formId).first().throwIfNotFound();
    await FormMetadata.query().deleteById(existing.id);
  },

  upsert: async (formId, data, currentUser, transaction) => {
    service.validate(data);
    const externalTrx = transaction != undefined;
    let trx;
    try {
      trx = externalTrx ? transaction : await FormMetadata.startTransaction();
      const existing = await FormMetadata.query(trx).modify('filterFormId', formId).first(); //only 1...
      if (existing) {
        await FormMetadata.query(trx)
          .findById(existing.id)
          .update({
            ...data,
            updatedBy: currentUser.usernameIdp,
          });
      } else {
        const rec = service.initModel(formId, data);
        await FormMetadata.query(trx).insert({
          ...rec,
          createdBy: currentUser.usernameIdp,
        });
      }
      if (!externalTrx) trx.commit();
    } catch (err) {
      if (!externalTrx && trx) await trx.rollback();
      throw err;
    }
    return service.read(formId);
  },
};

module.exports = service;
