const service = require('./service');

module.exports = {
  list: async (req, res, next) => {
    try {
      const response = await service.list();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  create:  async (req, res, next) => {
    try {
      const response = await service.create(req.body);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
  read:  async (req, res, next) => {
    try {
      const response = await service.read(req.params.id);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  update:  async (req, res, next) => {
    try {
      const response = await service.update(req.params.id, req.body);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  delete:  async (req, res, next) => {
    try {
      const response = await service.delete(req.params.id);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

};
