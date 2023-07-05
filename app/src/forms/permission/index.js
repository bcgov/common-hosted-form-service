const dataErrors = require('../common/middleware').dataErrors;
const routes = require('./routes');
const setupMount = require('../common/utils').setupMount;
const swaggerSpec = require('../../swagger/swaggerui');

swaggerSpec.tags.push({
  name: 'Permissions',
  description:
    'The API uses Permissions to control access to a defined set of features of and application, for example, reading form submissions or updating the design of a form. Permissions are assigned to roles.',
});

module.exports.mount = (app) => {
  return setupMount('permissions', app, routes, dataErrors);
};
