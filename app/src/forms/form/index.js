const routes = require('./routes');
const setupMount = require('../common/utils').setupMount;

const encryptionKeyRoutes = require('./encryptionKey/routes');
const eventStreamConfigRoutes = require('./eventStreamConfig/routes');
const externalApiRoutes = require('./externalApi/routes');
const embedRoutes = require('./embed/routes');
module.exports.mount = (app) => {
  const p = setupMount('forms', app, [routes, encryptionKeyRoutes, eventStreamConfigRoutes, externalApiRoutes, embedRoutes]);
  return p;
};
