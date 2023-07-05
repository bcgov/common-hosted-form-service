const dataErrors = require('../common/middleware').dataErrors;
const routes = require('./routes');
const setupMount = require('../common/utils').setupMount;

const swaggerSpec = require('../../swagger/swaggerui');

swaggerSpec.tags.push({
  name: 'Roles',
  description:
    "The API includes endpoints for managing roles assigned to users. A role, for example, 'Form Designer' or 'Submission Reviewer' will often correspond to the business functions of a user's job. Roles have a group of related permissions that are used to control access to a defined set of features of and application.",
});

module.exports.mount = (app) => {
  return setupMount('roles', app, routes, dataErrors);
};
