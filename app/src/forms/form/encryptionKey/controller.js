const service = require('./service');

module.exports = {
  listEncryptionAlgorithms: async (req, res, next) => {
    try {
      const response = await service.listEncryptionAlgorithms();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  listEncryptionKeys: async (req, res, next) => {
    try {
      const response = await service.listEncryptionKeys(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  createEncryptionKey: async (req, res, next) => {
    try {
      const response = await service.createEncryptionKey(req.params.formId, req.body, req.currentUser);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
  readEncryptionKey: async (req, res, next) => {
    try {
      const response = await service.readEncryptionKey(req.params.formId, req.params.formEncryptionKeyId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  updateEncryptionKey: async (req, res, next) => {
    try {
      const response = await service.updateEncryptionKey(req.params.formId, req.params.formEncryptionKeyId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  deleteEncryptionKey: async (req, res, next) => {
    try {
      await service.deleteEncryptionKey(req.params.formId, req.params.formEncryptionKeyId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
