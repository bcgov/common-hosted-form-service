const service = require('./service');

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
      const response = await service.read(req.params.id, req.currentUser);
      res.status(200).json(_trim(response));
    } catch (error) {
      next(error);
    }
  },
  delete:  async (req, res, next) => {
    try {
      await service.delete(req.params.id, req.currentUser);
      res.sendStatus(202);
    } catch (error) {
      next(error);
    }
  },

};
