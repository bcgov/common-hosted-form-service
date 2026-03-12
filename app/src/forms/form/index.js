const routes = require('./routes');
const setupMount = require('../common/utils').setupMount;

const documentTemplateRoutes = require('./documentTemplate/routes');
const encryptionKeyRoutes = require('./encryptionKey/routes');
const eventStreamConfigRoutes = require('./eventStreamConfig/routes');
const externalApiRoutes = require('./externalApi/routes');
const printConfigRoutes = require('./printConfig/routes');

module.exports.mount = (app) => {
  const p = setupMount('forms', app, [routes, documentTemplateRoutes, encryptionKeyRoutes, eventStreamConfigRoutes, externalApiRoutes, printConfigRoutes]);
  return p;
};
