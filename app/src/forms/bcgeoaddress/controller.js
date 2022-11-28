const service = require('./service');

module.exports = {
  searchBCGeoAddress: async (req, res, next) => {
    try {
      const response = await service.searchBCGeoAddress({peferUrl:req.body.url, preferQueryProp:req.body.queryProperty, preferRespProp:req.body.responseProperty,
        preferDisplayValueProp:req.body.displayValueProperty, preferQueryParams:req.body.queryParameters});
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

};
