const service = require('./service');

module.exports = {
  searchBCGeoAddress: async (req, res, next) => {
    try {
      const { query } = req;
      const response = await service.searchBCGeoAddress(query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  advanceSearchBCGeoAddress: async (req, res, next) => {
    try {
      const { query } = req;
      const response = await service.advanceSearchBCGeoAddress(query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
