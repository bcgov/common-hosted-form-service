const Problem = require('api-problem');

const { v4: uuidv4 } = require('uuid');

const { FormEncryptionKey } = require('../../common/models');

const { ENCRYPTION_ALGORITHMS } = require('../../../components/encryptionService');

const service = {
  listEncryptionAlgorithms: () => {
    return Object.values(ENCRYPTION_ALGORITHMS).map((x) => ({
      code: x,
      display: x,
    }));
  },

  validateEncryptionKey: (data) => {
    if (!data) {
      throw new Problem(422, `'EncryptionKey record' cannot be empty.`);
    }
  },

  listEncryptionKeys: (formId) => {
    return FormEncryptionKey.query().modify('filterFormId', formId);
  },

  createExternalAPI: async (formId, data, currentUser) => {
    service.validateEncryptionKey(data);

    data.id = uuidv4();
    await FormEncryptionKey.query().insert({
      ...data,
      createdBy: currentUser.usernameIdp,
    });

    return FormEncryptionKey.query().findById(data.id);
  },

  updateExternalAPI: async (formId, formEncryptionKeyId, data, currentUser) => {
    service.validateEncryptionKey(data);

    const existing = await FormEncryptionKey.query().modify('findByIdAndFormId', formEncryptionKeyId, formId).first().throwIfNotFound();
    // compare to see if we are actually updating any attributes.
    data.code = existing.code;
    await FormEncryptionKey.query()
      .findById(formEncryptionKeyId)
      .update({
        ...data,
        updatedBy: currentUser.usernameIdp,
      });

    return FormEncryptionKey.query().findById(formEncryptionKeyId);
  },

  deleteExternalAPI: async (formId, formEncryptionKeyId) => {
    await FormEncryptionKey.query().modify('findByIdAndFormId', formEncryptionKeyId, formId).first().throwIfNotFound();
    await FormEncryptionKey.query().deleteById(formEncryptionKeyId);
  },

  readEncryptionKey: (formEncryptionKeyId) => {
    return FormEncryptionKey.findById(formEncryptionKeyId);
  },
};

module.exports = service;
