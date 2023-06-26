const dataErrors = require('../common/middleware').dataErrors;
const routes = require('./routes');
const setupMount = require('../common/utils').setupMount;

const swaggerSpec = require('../../swagger/swaggerui');

swaggerSpec.tags.push({
  name: 'Users',
  description: 'The section includes API endpoints for carrying out operations with data related to users of the application.',
});

module.exports.mount = (app) => {
  return setupMount('users', app, routes, dataErrors);
};
