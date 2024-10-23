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
  readEncryptionKey: async (req, res, next) => {
    try {
      const response = await service.readEncryptionKey(req.params.formId, req.params.formEncryptionKeyId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
