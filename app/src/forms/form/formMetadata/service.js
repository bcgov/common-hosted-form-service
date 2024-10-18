const Problem = require('api-problem');

const { v4: uuidv4 } = require('uuid');

const { FormMetadata } = require('../../common/models');
const { typeUtils } = require('../../common/utils');

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
      metadata: data.metadata ? data.metadata : {},
    };
  },

  read: async (formId) => {
    return FormMetadata.query().modify('filterFormId', formId).first();
  },

  hasMetadata: (formMetadata) => {
    return formMetadata && formMetadata.metadata && Object.keys(formMetadata.metadata).length;
  },

  addMetadataToObject: async (formId, data, name, encode) => {
    if (!formId || !data || !name) return;
    if (![DEFAULT_ATTRIBUTENAME, DEFAULT_HEADERNAME].includes(name)) return;

    if (data && typeUtils.isObject(data)) {
      const o = await service.read(formId);
      if (service.hasMetadata(o)) {
        let value = o.metadata;
        if (encode) {
          let bufferObj = Buffer.from(JSON.stringify(o.metadata), 'utf8');
          value = bufferObj.toString('base64');
        }
        data[name] = value;
      }
    }
  },

  addAttribute: async (formId, obj) => {
    return await service.addMetadataToObject(formId, obj, DEFAULT_ATTRIBUTENAME);
  },

  addHeader: async (formId, headers) => {
    return await service.addMetadataToObject(formId, headers, DEFAULT_HEADERNAME, true);
  },

  _insert: async (formId, data, currentUser, transaction) => {
    const rec = service.initModel(formId, data);
    await FormMetadata.query(transaction).insert({
      ...rec,
      createdBy: currentUser.usernameIdp,
    });
  },

  _update: async (existing, data, currentUser, transaction) => {
    data.id = existing.id; //make sure that id wasn't changed in transit
    await FormMetadata.query(transaction)
      .findById(existing.id)
      .update({
        ...data,
        updatedBy: currentUser.usernameIdp,
      });
  },

  upsert: async (formId, data, currentUser, transaction) => {
    service.validate(data);
    const externalTrx = transaction != undefined;
    let trx;
    try {
      trx = externalTrx ? transaction : await FormMetadata.startTransaction();
      const existing = await service.read(formId);
      if (existing) {
        await service._update(existing, data, currentUser, transaction);
      } else {
        await service._insert(formId, data, currentUser, transaction);
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
