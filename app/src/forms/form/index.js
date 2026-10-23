const routes = require('./routes');
const setupMount = require('../common/utils').setupMount;

const documentTemplateRoutes = require('./documentTemplate/routes');
const encryptionKeyRoutes = require('./encryptionKey/routes');
const eventStreamConfigRoutes = require('./eventStreamConfig/routes');
const externalApiRoutes = require('./externalApi/routes');
const printConfigRoutes = require('./printConfig/routes');
const webcomponentSettingsRoutes = require('./webcomponentSettings/routes');

module.exports.mount = (app) => {
  const subRouters = [
    {
      router: documentTemplateRoutes,
      patterns: ['documentTemplates'],
    },
    {
      router: encryptionKeyRoutes,
      // Matches :/formId/encryptionKey and :/formId/encryptionKeys for backwards compatibility with old routes
      patterns: ['encryptionKey', 'encryptionKeys'],
    },
    {
      router: eventStreamConfigRoutes,
      patterns: ['eventStreamConfig', 'eventStreamConfigs'],
    },
    {
      router: externalApiRoutes,
      patterns: ['externalAPIs', 'externalApis'],
    },
    {
      router: printConfigRoutes,
      patterns: ['printConfig', 'printConfigs'],
    },
    {
      router: webcomponentSettingsRoutes,
      patterns: ['webcomponentSettings'],
    },
  ];
  const p = setupMount('forms', app, {
    mainRouter: routes,
    subRouters: subRouters,
  });
  return p;
};
