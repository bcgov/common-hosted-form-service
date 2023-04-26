const config = require('config');
const { v4: uuidv4 } = require('uuid');

const Queue = require('bull');

const { FileStorage } = require('../common/models');
const storageService = require('./storage/storageService');

const PERMANENT_STORAGE = config.get('files.permanent');

// create our job queue
const queue = new Queue('Upload files queue', { redis: { password: 'redispass' } });

const service = {
  create: async (data, currentUser) => {
    const job = await queue.add('Upload files job', {
      fileData: data,
      user: currentUser,
    });

    queue
      .on('completed', function () {
        console.log('Upload file Job completed...');
      })
      .on('failed', function () {
        console.log('Upload file Job failed');
      })
      .on('progress', function (job, progress) {
        console.log('\rUpload file job #' + job.id + ' ' + progress + '% complete');
      });

    // process upload file jobs, 1 at a time.
    queue.process('Upload files job', 1, async (job, done) => {
      const data = job.data.fileData;
      const currentUser = job.data.user;

      job.progress(0);
      let trx;
      try {
        trx = await FileStorage.startTransaction();

        const obj = {};
        obj.id = uuidv4();
        obj.storage = 'uploads';
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
        job.progress(100);
        return done(null, result);
      } catch (err) {
        if (trx) await trx.rollback();
        return done(new Error(err));
      }
    });
    console.log(job);
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
