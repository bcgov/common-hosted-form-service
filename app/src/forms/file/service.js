const config = require('config');
const uuid = require('uuid');
const path = require('path');
const { FileStorage } = require('../common/models');
const log = require('../../components/log')(module.filename);
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
   * Best-effort deletion of the stored object for a file, without touching the
   * database record. Used to remove the original object after a submission file
   * has been copied to permanent storage, and to purge orphaned objects once the
   * DB rows are gone. Storage failures are logged and swallowed so they can't
   * undo work that has already been committed.
   *
   * @param {FileStorage} fileStorage the file storage object to remove.
   * @returns {Promise<boolean>} true if the object was removed.
   */
  deleteStorageObject: async (fileStorage) => {
    try {
      return await storageService.delete(fileStorage);
    } catch (err) {
      log.error(`Failed to delete stored object for file ${fileStorage?.id}`, err);
      return false;
    }
  },

  /**
   * Move a submission file from the "upload" storage location to the
   * "submission" location. This is used when a submission is either saved as
   * draft or submitted, and makes the uploaded files permanent.
   *
   * When an existing transaction is supplied the database update runs inside it
   * and the caller owns both the commit and the cleanup of the original object
   * (which must happen only after the commit). This avoids opening a second
   * transaction that would deadlock against the caller's row lock. Without a
   * transaction this manages its own and cleans up the original itself.
   *
   * @param {uuidv4} submissionId the id of the submission that holds the file.
   * @param {FileStorage} fileStorage the file storage object for the file.
   * @param {string} updatedBy the user who is saving the submission.
   * @param {*} [etrx] an optional existing transaction to run within.
   * @returns {Promise<FileStorage>} the original file storage object (pre-move),
   *   so the caller can clean up the source object after committing.
   */
  moveSubmissionFile: async (submissionId, fileStorage, updatedBy, etrx = undefined) => {
    let trx;
    try {
      trx = etrx || (await FileStorage.startTransaction());

      // Copy the file from its current directory to the "submissions" subdirectory.
      const path = await storageService.move(fileStorage, 'submissions', submissionId);
      if (!path) {
        throw new Error('Error moving files for submission');
      }

      await FileStorage.query(trx).patchAndFetchById(fileStorage.id, {
        formSubmissionId: submissionId,
        path: path,
        storage: PERMANENT_STORAGE,
        updatedBy: updatedBy,
      });

      // Only manage commit/cleanup when we own the transaction.
      if (!etrx) {
        await trx.commit();
        await service.deleteStorageObject(fileStorage);
      }

      return fileStorage;
    } catch (err) {
      if (!etrx && trx) await trx.rollback();
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
