const Problem = require('api-problem');
const config = require('config');
const uuid = require('uuid');
const path = require('path');
const { FileStorage, SubmissionPackageJob } = require('../common/models');
const { StorageTypes } = require('../common/constants');
const log = require('../../components/log')(module.filename);
const storageService = require('./storage/storageService');
const uploadCleanup = require('./uploadCleanup');

const PERMANENT_STORAGE = config.get('files.permanent');

// Ids per query, well below the Postgres limit of 65,535 bind parameters
const FILE_ID_BATCH = 1000;

const UNSUBMITTED_UPLOADS_ONLY = 'The submission references a file that was not uploaded for this form or is already part of a submission.';

// Distinct ids in batches of FILE_ID_BATCH
const idBatches = (ids) => {
  const unique = [...new Set(ids)];
  const batches = [];
  for (let i = 0; i < unique.length; i += FILE_ID_BATCH) batches.push(unique.slice(i, i + FILE_ID_BATCH));
  return batches;
};

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
 * CRITICAL SECURITY: File validation at service layer. Throws 4xx Problems:
 * the request is at fault, not the server. The name is never used as a path
 * (multer stores the file under a sanitized name), so only path separators are
 * refused; a name such as `a..b.pdf` is allowed.
 */
const validateFileSecurity = (file) => {
  if (!file || !file.originalname) {
    throw new Problem(400, { detail: 'No file provided for upload' });
  }

  const fileName = file.originalname.toLowerCase();
  const fileExtension = path.extname(fileName);

  if (BLOCKED_EXTENSIONS.some((ext) => fileName.endsWith(ext))) {
    throw new Problem(415, { detail: `File type ${fileExtension} is not allowed for security reasons` });
  }

  if (fileName.includes('/') || fileName.includes('\\')) {
    throw new Problem(400, { detail: 'Filename contains dangerous characters' });
  }

  return true;
};

// Non-throwing rollback so a rollback failure doesn't skip downstream compensation.
const safeRollback = async (trx, fileId) => {
  if (!trx) return;
  try {
    await trx.rollback();
  } catch (rollbackErr) {
    log.warn('FileStorage rollback failed', { fileId, err: rollbackErr?.message });
  }
};

const service = {
  validateFileSecurity,

  // formId records the form a web component upload is for; other uploads leave it unset
  create: async (data, currentUser, folder = StorageTypes.UPLOADS, { formId } = {}) => {
    const tempPath = data?.path;
    let trx;
    let uploadResult;
    let obj;
    // Once the transaction commits, the file record and its stored object are
    // durable and reference each other. Anything that fails after this point
    // (e.g. the read-back below) must NOT trigger compensation, or we would roll
    // back an already-committed transaction and delete the object that a
    // committed row still points at - orphaning the record.
    let committed = false;

    try {
      validateFileSecurity(data);

      trx = await FileStorage.startTransaction();

      obj = {};
      obj.id = uuid.v4();
      obj.storage = folder;
      obj.originalName = data.originalname;
      obj.mimeType = data.mimetype;
      obj.size = data.size;
      obj.path = data.path;
      obj.createdBy = currentUser?.usernameIdp || 'public';
      if (formId) obj.formId = formId;

      uploadResult = await storageService.upload(obj);
      obj.path = uploadResult.path;
      obj.storage = uploadResult.storage;
      await FileStorage.query(trx).insert(obj);

      await trx.commit();
      committed = true;

      if (uploadResult.storage === StorageTypes.OBJECT_STORAGE) {
        await uploadCleanup.removeUploadedFile(tempPath, 'object-storage-upload-success');
      }

      const result = await service.read(obj.id);
      return result;
    } catch (err) {
      // Compensation only applies while the work is still undoable. After a
      // successful commit the object is legitimately referenced (and for local
      // storage the temp file IS that object), so leave everything in place.
      if (!committed) {
        await safeRollback(trx, obj?.id);

        if (uploadResult && obj?.id) {
          await service.deleteStorageObject({
            id: obj.id,
            path: uploadResult.path,
            storage: uploadResult.storage,
          });
        }

        await uploadCleanup.removeUploadedFile(tempPath, 'create-failure');
      }

      // Post-commit failure: row is durable but caller won't see fileResult; surface the id.
      if (committed && obj?.id) {
        log.warn('FileStorage post-commit failure', { fileId: obj.id, err: err?.message });
      }

      throw err;
    }
  },

  read: async (id) => {
    return FileStorage.query().findById(id).throwIfNotFound();
  },

  /**
   * Finds files by id, one batch of ids per query and one query at a time, so a body
   * listing many ids neither exceeds the query parameter limit nor floods the pool.
   *
   * @param {string[]} ids the file ids; repeats are looked up once.
   * @returns {Promise<FileStorage[]>} the files found; ids that match no file are left out.
   */
  findByIds: async (ids) => {
    return idBatches(ids).reduce(async (previous, batch) => {
      const found = await previous;
      for (const file of await FileStorage.query().findByIds(batch)) found.push(file);
      return found;
    }, Promise.resolve([]));
  },

  /**
   * Refuses to link a file to a submission of another form. A web component upload records
   * the form it was uploaded for; other uploads record none and are not checked.
   *
   * @param {FileStorage[]} files the files a submission references.
   * @param {string} formId the id of the submission's form.
   * @throws {Problem} 422 when a file was uploaded for another form.
   */
  checkFilesForForm: (files, formId) => {
    if (files.some((file) => file?.formId && file.formId !== formId)) {
      throw new Problem(422, { detail: 'The submission references a file uploaded for another form.' });
    }
  },

  /**
   * Refuses files an anonymous submission may not link: each must have been uploaded for
   * the submission's form and not yet be part of a submission.
   *
   * @param {FileStorage[]} files the files a submission references.
   * @param {string} formId the id of the submission's form.
   * @throws {Problem} 422 when a file was uploaded elsewhere or is already submitted.
   */
  checkUnsubmittedUploads: (files, formId) => {
    if (files.some((file) => file.formId !== formId || file.formSubmissionId)) {
      throw new Problem(422, { detail: UNSUBMITTED_UPLOADS_ONLY });
    }
  },

  /**
   * Deletes an upload for a form that no submission has yet. The row is matched as it is
   * deleted, so a submission that links the file first keeps it.
   *
   * @param {string} id the file id.
   * @param {string} formId the form the upload must be for.
   * @returns {Promise<void>}
   * @throws {Problem} 404 when there is no such upload.
   */
  deleteUnsubmittedUpload: async (id, formId) => {
    let trx;
    try {
      trx = await FileStorage.startTransaction();
      const [obj] = await FileStorage.query(trx).delete().where({ id, formId }).whereNull('formSubmissionId').returning('*');
      if (!obj) throw new Problem(404, { detail: 'File not found.' });

      await storageService.delete(obj);
      await trx.commit();
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  /**
   * Whether a file is a built submission package, i.e. a submission package
   * job references it. Package files are emailed as plain links and must stay
   * readable without a session.
   *
   * @param {uuidv4} id the file id.
   * @returns {Promise<boolean>} true if a package job references the file.
   */
  isPackageFile: async (id) => {
    const job = await SubmissionPackageJob.query().select('id').where('packageFileId', id).first();
    return !!job;
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
   * Attaches pending files to a submission inside the caller's transaction.
   * Each file is taken only while it is on no submission, so two saves at once
   * cannot both take one; the second waits for the first to commit and then
   * gets a 409. Nothing is moved in storage.
   *
   * @param {uuidv4} submissionId the submission to attach the files to.
   * @param {FileStorage[]} files the pending files to attach.
   * @param {string} updatedBy the user who is saving the submission.
   * @param {*} trx the submission transaction.
   * @param {object} [options]
   * @param {string} [options.formId] take each file only while it is an upload for this form.
   * @throws Problem 409 if another save has attached any of the files first.
   */
  claimSubmissionFiles: async (submissionId, files, updatedBy, trx, { formId } = {}) => {
    if (!files.length) return;

    let query = FileStorage.query(trx)
      .patch({ formSubmissionId: submissionId, updatedBy: updatedBy })
      .whereIn(
        'id',
        files.map((file) => file.id)
      )
      .whereNull('formSubmissionId');
    if (formId) query = query.where('formId', formId);
    const claimed = await query;

    if (claimed !== files.length) {
      throw new Problem(409, { detail: 'A file in this submission changed while it was being saved. Please try again.' });
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
};

module.exports = service;
