const dataErrors = require('../common/middleware').dataErrors;
const routes = require('./routes');
const setupMount = require('../common/utils').setupMount;

const swaggerSpec = require('../../swagger/swaggerui');

swaggerSpec.tags.push({
  name: 'Submissions',
  description:
    'These API endpoints handle the input data provided by a user that completes the form, for example, writing the form data to the database, or exporting form submissions created during a defined time period.',
});

swaggerSpec.tags.push({
  name: 'Status',
  description: 'These API endpoints handle operations to update and retrieve statuses and notes on a submission, and status code management for a Form.',
});

module.exports.mount = (app) => {
  return setupMount('submissions', app, routes, dataErrors);
};
