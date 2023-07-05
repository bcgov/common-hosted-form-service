const dataErrors = require('../common/middleware').dataErrors;
const routes = require('./routes');
const setupMount = require('../common/utils').setupMount;

const swaggerSpec = require('../../swagger/swaggerui');

swaggerSpec.tags.push({
  name: 'Admin',
  description:
    'These API endpoints are used for elevated permission administrative calls. All calls are secured by a role that operational team members will be granted and allow fetching some details about forms without needing a user->form permission.',
});

module.exports.mount = (app) => {
  return setupMount('admin', app, routes, dataErrors);
};
