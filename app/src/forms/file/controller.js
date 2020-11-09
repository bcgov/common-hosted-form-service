const service = require('./service');
const storageService = require('./storage/storageService');
const submissionService = require('../submission/service');
const Permissions = require('../common/constants').Permissions;

const _trim = (r) => {
  if (r) {
    // don't want storage information going over the wire...
    return {
      id: r.id,
      originalName: r.originalName,
      size: r.size,
      createdBy: r.createdBy,
      createdAt: r.createdAt
    };
  }
  return r;
};

module.exports = {

  create:  async (req, res, next) => {
    try {
      const response = await service.create(req.file, req.currentUser);
      res.status(201).json(_trim(response));
    } catch (error) {
      next(error);
    }
  },
  read:  async (req, res, next) => {
    try {
      const fileStorage = await service.read(req.params.id, req.currentUser);

      // check to see if this has been associated with a submission...
      // if so, we need to verify this user can access the submission.
      if (fileStorage.formSubmissionId) {
        // will throw permissions error if user not allowed to read
        await submissionService.read(fileStorage.formSubmissionId, req.currentUser);
      }

      // ok, let's go get the binary...
      const stream = await storageService.read(fileStorage);

      stream.on('error', function error(err) {
        throw (err);
      });

      // set the reponse binary headers...
      res.setHeader('Content-Disposition', `attachment; filename=${fileStorage.originalName}`);
      res.set('Content-Type', fileStorage.mimeType);
      res.set('Content-Length', fileStorage.size);
      res.set('Last-Modified', fileStorage.updatedAt);

      // and stream it out...
      stream.pipe(res);

    } catch (error) {
      next(error);
    }
  },
  delete:  async (req, res, next) => {
    try {
      // get the file storage record, we may need to check some permissions...
      const fileStorage = await service.read(req.params.id, req.currentUser);

      // check to see if this has been associated with a submission...
      // if so, we need to verify this user can access the submission.
      if (fileStorage.formSubmissionId) {
        // will throw permissions error if user not allowed to alter the submission...
        await submissionService.read(fileStorage.formSubmissionId, req.currentUser, Permissions.SUBMISSION_UPDATE);
      }

      // ok, let's remove the file...
      await service.delete(req.params.id);
      res.sendStatus(202);
    } catch (error) {
      next(error);
    }
  },

};
