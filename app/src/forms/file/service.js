const config = require('config');
const uuid = require('uuid');
const path = require('path');
const { FileStorage } = require('../common/models');
const storageService = require('./storage/storageService');

const PERMANENT_STORAGE = config.get('files.permanent');

const BLOCKED_EXTENSIONS = [
  '.exe',
  '.bat',
  '.scr',
  '.com',
  '.pif',
  '.cmd',
  '.jar',
  '.app',
  '.deb',
  '.dmg',
  '.msi',
  '.run',
  '.bin',
  '.sh',
  '.ps1',
  '.vbs',
  '.js',
  '.html',
  '.php',
  '.py',
  '.rb',
  '.jsp',
  '.asp',
  '.aspx',
];

/**
 * CRITICAL SECURITY: File validation at service layer
 */
const validateFileSecurity = (file) => {
  if (!file || !file.originalname) {
    throw new Error('No file provided for upload');
  }

  const fileName = file.originalname.toLowerCase();
  const fileExtension = path.extname(fileName);

  if (BLOCKED_EXTENSIONS.some((ext) => fileName.endsWith(ext))) {
    throw new Error(`File type ${fileExtension} is not allowed for security reasons`);
  }

  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    throw new Error('Filename contains dangerous characters');
  }

  return true;
};

const service = {
  create: async (data, currentUser, folder = 'uploads') => {
    validateFileSecurity(data);

    let trx;
    try {
      trx = await FileStorage.startTransaction();

      const obj = {};
      obj.id = uuid.v4();
      obj.storage = folder;
      obj.originalName = data.originalname;
      obj.mimeType = data.mimetype;
      obj.size = data.size;
      obj.path = data.path;
      obj.createdBy = currentUser?.usernameIdp || 'public';

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

  deleteFiles: async (ids) => {
    let trx;
    try {
      trx = await FileStorage.startTransaction();

      for (const id of ids) {
        const obj = await service.read(id);

        await FileStorage.query(trx).deleteById(id).throwIfNotFound();

        const result = await storageService.delete(obj);
        if (!result) {
          throw new Error(`Failed to delete file with id ${id}`);
        }
      }

      await trx.commit();
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  /**
   * Move a submission file from the "upload" storage location to the
   * "submission" location. This is used when a submission is either saved as
   * draft or submitted, and makes the uploaded files permanent.
   *
   * @param {uuidv4} submissionId the id of the submission that holds the file.
   * @param {FileStorage} fileStorage the file storage object for the file.
   * @param {string} updatedBy the user who is saving the submission.
   */
  moveSubmissionFile: async (submissionId, fileStorage, updatedBy) => {
    // Move the file from its current directory to the "submissions" subdirectory.
    const path = await storageService.move(fileStorage, 'submissions', submissionId);
    if (!path) {
      throw new Error('Error moving files for submission');
    }

    await FileStorage.query().patchAndFetchById(fileStorage.id, {
      formSubmissionId: submissionId,
      path: path,
      storage: PERMANENT_STORAGE,
      updatedBy: updatedBy,
    });
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

  clone: async (data, currentUser) => {
    let trx;
    try {
      trx = await FileStorage.startTransaction();

      const file = await FileStorage.query().findById(data).throwIfNotFound();

      // Remove the ID to avoid conflicts when inserting
      const obj = { ...file };

      const uploadResult = await storageService.clone(obj);
      obj.id = uploadResult.id;
      obj.path = uploadResult.path;
      obj.storage = uploadResult.storage;
      obj.createdBy = currentUser.usernameIdp;

      await FileStorage.query(trx).insert(obj);

      await trx.commit();
      const result = await service.read(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },
};

module.exports = service;
