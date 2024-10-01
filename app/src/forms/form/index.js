const routes = require('./routes');
const setupMount = require('../common/utils').setupMount;

const externalApiRoutes = require('./externalApi/routes');
const formMetadataRoutes = require('./formMetadata/routes');

module.exports.mount = (app) => {
  const p = setupMount('forms', app, [routes, externalApiRoutes, formMetadataRoutes]);
  return p;
};
