const routes = require('./routes');
const setupMount = require('../../../forms/common/utils').setupMount;

module.exports.mount = (app) => {
  return setupMount('submissions', app, routes);
};
