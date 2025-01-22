const uuid = require('uuid');
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

  _initModel: (formId, data) => {
    data.id = uuid.v4();
    data.formId = formId;
    data.name = PRIVATE_EVENT_STREAM_NAME;
  },

  _update: async (existing, data, currentUser, transaction) => {
    // only update if data has changed.
    if (existing.algorithm != data.algorithm || existing.key != data.key) {
      // yes... update.
      await FormEncryptionKey.query(transaction)
        .findById(existing.id)
        .update({
          ...data,
          updatedBy: currentUser.usernameIdp,
        });
    }
  },

  _insert: async (data, currentUser, transaction) => {
    if (data && data.algorithm && data.key) {
      await FormEncryptionKey.query(transaction).insert({
        ...data,
        createdBy: currentUser.usernameIdp,
        updatedBy: currentUser.usernameIdp,
      });
      return data.id;
    }
  },

  upsertForEventStreamConfig: async (formId, data, currentUser, transaction) => {
    // special case for forms. they have only one event stream configuration
    // that requires an encryption key if it has private streams.
    // NOTE: event stream config will remove this key if it is unneeded!
    if (!data) return;
    const externalTrx = transaction != undefined;
    let trx;
    let id;
    try {
      trx = externalTrx ? transaction : await FormEncryptionKey.startTransaction();
      const existing = await FormEncryptionKey.query(trx).modify('findByFormIdAndName', formId, PRIVATE_EVENT_STREAM_NAME).first();
      if (existing) {
        id = existing.id;
        await service._update(existing, data, currentUser, trx);
      } else {
        // add a new configuration.
        service._initModel(formId, data);
        id = await service._insert(data, currentUser, trx); //returns id if inserted.
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

  readEncryptionKey: async (formId, formEncryptionKeyId) => {
    return FormEncryptionKey.query().modify('findByIdAndFormId', formEncryptionKeyId, formId).first();
  },
};

module.exports = service;
