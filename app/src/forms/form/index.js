const routes = require('./routes');
const setupMount = require('../common/utils').setupMount;

const encryptionKeyRoutes = require('./encryptionKey/routes');
const eventStreamConfigRoutes = require('./eventStreamConfig/routes');
const externalApiRoutes = require('./externalApi/routes');

module.exports.mount = (app) => {
  const p = setupMount('forms', app, [routes, encryptionKeyRoutes, eventStreamConfigRoutes, externalApiRoutes]);
  return p;
};
