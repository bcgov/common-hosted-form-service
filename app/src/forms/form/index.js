const dataErrors = require('../common/middleware').dataErrors;
const routes = require('./routes');
const setupMount = require('../common/utils').setupMount;

const swaggerSpec = require('../../swagger/swaggerui');

swaggerSpec.tags.push({
  name: 'Forms',
  description:
    'This section supports the creation, management and removal of form scoped API Key secrets. CHEFS endpoints which permit Basic Authentication use the Form ID as username and the API Key as the password.',
});

module.exports.mount = (app) => {
  return setupMount('forms', app, routes, dataErrors);
};
