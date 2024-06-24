const routes = require('./routes');
const setupMount = require('../common/utils').setupMount;

const externalApiRoutes = require('./externalApi/routes');

module.exports.mount = (app) => {
  const p = setupMount('forms', app, [routes, externalApiRoutes]);
  return p;
};
