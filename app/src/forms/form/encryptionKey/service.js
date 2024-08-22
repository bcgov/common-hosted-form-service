const Problem = require('api-problem');

const { v4: uuidv4 } = require('uuid');

const { FormEncryptionKey } = require('../../common/models');

const { ENCRYPTION_ALGORITHMS } = require('../../../components/encryptionService');

const PRIVATE_EVENT_STREAM_NAME = 'private-event-stream';

const service = {
  listEncryptionAlgorithms: async () => {
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

  upsertForEventStreamConfig: async (formId, data, currentUser, transaction) => {
    // special case for forms. they have only one event stream configuration
    // that requires an encryption key if it has private streams.
    // NOTE: event stream config will remove this key if it is unneeded!

    const externalTrx = transaction != undefined;
    let trx;
    let id;
    try {
      trx = externalTrx ? transaction : await FormEncryptionKey.startTransaction();
      const existing = await FormEncryptionKey.query(trx).modify('findByFormIdAndName', formId, PRIVATE_EVENT_STREAM_NAME).first();

      if (existing) {
        id = existing.id;
        // do we need to update?
        if (existing.algorithm != data.algorithm || existing.key != data.key) {
          // yes... update.
          await FormEncryptionKey.query(trx)
            .findById(existing.id)
            .update({
              ...data,
              updatedBy: currentUser.usernameIdp,
            });
        }
      } else {
        // add a new configuration.
        if (data && !data.algorithm && !data.key) return; // no encryption key to insert
        id = uuidv4();
        data.id = id;
        data.formId = formId;
        data.name = PRIVATE_EVENT_STREAM_NAME;
        await FormEncryptionKey.query(trx).insert({
          ...data,
          createdBy: currentUser.usernameIdp,
          updatedBy: currentUser.usernameIdp,
        });
      }

      if (!externalTrx) trx.commit();
      if (id) {
        return FormEncryptionKey.query(trx).findById(id);
      }
    } catch (err) {
      if (!externalTrx && trx) await trx.rollback();
      throw err;
    }
  },

  remove: async (id, transaction) => {
    const externalTrx = transaction != undefined;
    let trx;
    try {
      trx = externalTrx ? transaction : await FormEncryptionKey.startTransaction();
      const existing = await FormEncryptionKey.query(trx).findById(id);

      if (existing) {
        await FormEncryptionKey.query(trx).deleteById(id);
      }

      if (!externalTrx) trx.commit();
    } catch (err) {
      if (!externalTrx && trx) await trx.rollback();
      throw err;
    }
  },

  createEncryptionKey: async (formId, data, currentUser) => {
    service.validateEncryptionKey(data);

    data.id = uuidv4();
    await FormEncryptionKey.query().insert({
      ...data,
      createdBy: currentUser.usernameIdp,
    });

    return FormEncryptionKey.query().findById(data.id);
  },

  updateEncryptionKey: async (formId, formEncryptionKeyId, data, currentUser) => {
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

  deleteEncryptionKey: async (formId, formEncryptionKeyId) => {
    await FormEncryptionKey.query().modify('findByIdAndFormId', formEncryptionKeyId, formId).first().throwIfNotFound();
    await FormEncryptionKey.query().deleteById(formEncryptionKeyId);
  },

  readEncryptionKey: async (formId, formEncryptionKeyId) => {
    return FormEncryptionKey.query().modify('findByIdAndFormId', formEncryptionKeyId, formId).first();
  },

  fetchEncryptionKey: async (formId, name) => {
    return await FormEncryptionKey.query().modify('findByFormIdAndName', formId, name).first();
  },
};

module.exports = service;
