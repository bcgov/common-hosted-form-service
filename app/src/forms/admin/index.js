const dataErrors = require('../common/middleware').dataErrors;
const routes = require('./routes');
const setupMount = require('../common/utils').setupMount;

const swaggerSpec = require('../../swagger/swaggerui');

swaggerSpec.tags.push({
  name: 'Admin',
  description:
    'These API endpoints handle the input data provided by a user that completes the form, for example, writing the form data to the database, or exporting form submissions created during a defined time period.',
});

module.exports.mount = (app) => {
  return setupMount('admin', app, routes, dataErrors);
};
