const dataErrors = require('../common/middleware').dataErrors;
const routes = require('./routes');
const setupMount = require('../common/utils').setupMount;
const swaggerSpec = require('../../swagger/swaggerui');

swaggerSpec.tags.push({
  name: 'RBAC',
  description:
    'This section of the API documents the API endpoints related to Role-based Access Control (RBAC). RBAC is a method of restricting access based on roles. These endpoints handle a combination of user, role and permission data as well as the access settings for a published form.',
});

module.exports.mount = (app) => {
  return setupMount('rbac', app, routes, dataErrors);
};
