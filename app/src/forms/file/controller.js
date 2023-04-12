const service = require('./service');
const storageService = require('./storage/storageService');

const { encodeURI } = require('../common/utils');

const _trim = (r) => {
  if (r) {
    // don't want storage information going over the wire...
    return {
      id: r.id,
      originalName: r.originalName,
      size: r.size,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
    };
  }
  return r;
};

module.exports = {
  create: async (req, res, next) => {
    try {
      const response = await service.create(req.file, req.currentUser);
      res.status(201).json(_trim(response));
    } catch (error) {
      next(error);
    }
  },
  read: async (req, res, next) => {
    try {
      // Permissions checked on this at the route level with middleware
      // On the request from the middleware
      const fileStorage = req.currentFileRecord;

      // ok, let's go get the binary...
      const stream = await storageService.read(fileStorage);

      stream.on('error', function error(err) {
        throw err;
      });

      res.setHeader('Content-Disposition', `attachment; filename=${encodeURI(fileStorage.originalName)}`);
      res.set('Content-Type', fileStorage.mimeType);
      res.set('Content-Length', fileStorage.size);
      res.set('Last-Modified', fileStorage.updatedAt);

      // and stream it out...
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      // Permissions checked on this at the route level with middleware
      // ok, let's remove the file...
      await service.delete(req.params.id);
      res.sendStatus(202);
    } catch (error) {
      next(error);
    }
  },
};
