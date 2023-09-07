const config = require('config');
const { v4: uuidv4 } = require('uuid');

const { FileStorage } = require('../common/models');
const storageService = require('./storage/storageService');

const PERMANENT_STORAGE = config.get('files.permanent');

const service = {
  create: async (data, currentUser, folder = 'uploads') => {
    let trx;
    try {
      trx = await FileStorage.startTransaction();

      const obj = {};
      obj.id = uuidv4();
      obj.storage = folder;
      obj.originalName = data.originalname;
      obj.mimeType = data.mimetype;
      obj.size = data.size;
      obj.path = data.path;
      obj.createdBy = currentUser.usernameIdp;

      const uploadResult = await storageService.upload(obj);
      obj.path = uploadResult.path;
      obj.storage = uploadResult.storage;

      await FileStorage.query(trx).insert(obj);

      await trx.commit();
      const result = await service.read(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  read: async (id) => {
    return FileStorage.query().findById(id).throwIfNotFound();
  },

  delete: async (id) => {
    let trx;
    try {
      trx = await FileStorage.startTransaction();
      const obj = await service.read(id);

      await FileStorage.query(trx).deleteById(id).throwIfNotFound();

      const result = await storageService.delete(obj);
      if (!result) {
        // error?
      }
      await trx.commit();
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  moveSubmissionFiles: async (submissionId, currentUser) => {
    let trx;
    try {
      trx = await FileStorage.startTransaction();

      // fetch all the File Storage records for a submission id
      // move them to permanent storage
      // update their new paths.
      const items = await FileStorage.query(trx).where('formSubmissionId', submissionId);

      for (const item of items) {
        // move the files under a sub directory for this submission
        const newPath = await storageService.move(item, 'submissions', submissionId);
        if (!newPath) {
          throw new Error('Error moving files for submission');
        }
        await FileStorage.query(trx).patchAndFetchById(item.id, {
          storage: PERMANENT_STORAGE,
          path: newPath,
          updatedBy: currentUser.usernameIdp,
        });
      }
      await trx.commit();
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },
};

module.exports = service;
