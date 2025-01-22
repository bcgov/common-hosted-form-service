const Problem = require('api-problem');

const uuid = require('uuid');
const { FormEventStreamConfig } = require('../../common/models');

const encryptionKeyService = require('../encryptionKey/service');

const service = {
  validateEventStreamConfig: (data) => {
    if (!data) {
      throw new Problem(422, `'EventStreamConfig record' cannot be empty.`);
    }
  },

  upsert: async (formId, data, currentUser, transaction) => {
    service.validateEventStreamConfig(data);
    const externalTrx = transaction != undefined;
    let trx;
    try {
      trx = externalTrx ? transaction : await FormEventStreamConfig.startTransaction();
      const existing = await FormEventStreamConfig.query(trx).modify('filterFormId', formId).first(); //only 1...

      // let's deal with encryption key
      const encKey = await encryptionKeyService.upsertForEventStreamConfig(formId, data.encryptionKey, currentUser, transaction);
      data.encryptionKeyId = encKey && data.enablePrivateStream ? encKey.id : null;
      data.encryptionKey = null; // only want the id for config upsert

      if (existing) {
        // do we need to update?
        if (
          existing.enablePrivateStream != data.enablePrivateStream ||
          existing.enablePublicStream != data.enablePublicStream ||
          existing.encryptionKeyId != data.encryptionKeyId
        ) {
          // yes... update.
          // except the enabled field... do not allow change via API (yet)
          data.enabled = existing.enabled;
          await FormEventStreamConfig.query(trx)
            .findById(existing.id)
            .update({
              ...data,
              updatedBy: currentUser.usernameIdp,
            });
        }
      } else {
        // add a new configuration.
        data.id = uuid.v4();
        data.formId = formId;
        await FormEventStreamConfig.query(trx).insert({
          ...data,
          createdBy: currentUser.usernameIdp,
        });
      }
      // finally, if we do not have private stream AND we have an encryption key, delete it...
      if (!data.enablePrivateStream && encKey) {
        await encryptionKeyService.remove(encKey.id, trx);
      }
      if (!externalTrx) trx.commit();
    } catch (err) {
      if (!externalTrx && trx) await trx.rollback();
      throw err;
    }
  },

  readEventStreamConfig: async (formId) => {
    let result = await FormEventStreamConfig.query().modify('filterFormId', formId).first(); // there should be only one
    if (!result) {
      // let's create a default
      const rec = new FormEventStreamConfig();
      rec.formId = formId;
      return await service.upsert(formId, rec, { usernameIdp: 'systemdefault' });
    }
    return result;
  },
};

module.exports = service;
