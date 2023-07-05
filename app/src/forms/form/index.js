const dataErrors = require('../common/middleware').dataErrors;
const routes = require('./routes');
const setupMount = require('../common/utils').setupMount;

const swaggerSpec = require('../../swagger/swaggerui');

swaggerSpec.tags.push({
  name: 'Forms',
  description:
    'This section supports the creation, management and removal of form scoped API Key secrets. CHEFS endpoints which permit Basic Authentication use the Form ID as username and the API Key as the password.',
});

swaggerSpec.tags.push({
  name: 'Draft',
  description:
    'This section of the API includes endpoints used to perform various operations related to form drafts, for example create or publish a draft from a specific version of a form.',
});

swaggerSpec.tags.push({
  name: 'Version',
  description: 'The API supports versioning of forms. This allows a user to manage multiple versions of a form design and, for example, publish a specific version of a form.',
});

swaggerSpec.tags.push({
  name: 'Form API Key',
  description:
    'This section supports the creation, management and removal of form scoped API Key secrets. CHEFS endpoints which permit Basic Authentication use the Form ID as username and the API Key as the password.',
});

module.exports.mount = (app) => {
  return setupMount('forms', app, routes, dataErrors);
};
