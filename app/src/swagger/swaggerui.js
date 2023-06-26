const swaggerJsdoc = require('swagger-jsdoc');
const config = require('config');
const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs');
const { version } = require('../../package.json');
const submission = require('../swagger/responses/submission.json');
const deletedsubmission = require('../swagger/responses/deletedsubmission.json');
const deleteMultiSubmission = require('../swagger/responses/deleteMultiSubmission.json');
const restoreMultiSubmission = require('../swagger/responses/restoreMultiSubmission.json');
const listSubmissions = require('../swagger/responses/listSubmissions.json');
const getSpec = () => {
  const rawSpec = fs.readFileSync(path.join(__dirname, '../swagger/swagger_api_doc.yaml'), 'utf8');
  const spec = yaml.load(rawSpec);
  spec.definition.info.version = version;
  spec.definition.servers[0].url = `${config.get('server.basePath')}/api/v1`;
  spec.definition.components.securitySchemes.openId.openIdConnectUrl = `${config.get('server.keycloak.serverUrl')}/realms/${config.get(
    'server.keycloak.realm'
  )}/.well-known/openid-configuration`;

  exampleDocGen(spec);
  return spec;
};

const exampleDocGen = (spec) => {
  spec.definition.components['examples'] = {};

  //submission example
  spec.definition.components.examples['SubmissionEx'] = {};
  spec.definition.components.examples.SubmissionEx['value'] = submission;

  //deleted submission example
  spec.definition.components.examples['DeletedSubmissionEx'] = {};
  spec.definition.components.examples.DeletedSubmissionEx['value'] = deletedsubmission;

  //deleted multiple submission example
  spec.definition.components.examples['DeleteMultiSubmissionEx'] = {};
  spec.definition.components.examples.DeleteMultiSubmissionEx['value'] = deleteMultiSubmission;

  //Restore multiple submission example
  spec.definition.components.examples['RestoreMultiSubmissionEx'] = {};
  spec.definition.components.examples.RestoreMultiSubmissionEx['value'] = restoreMultiSubmission;

  //List submission example
  spec.definition.components.examples['ListSubmissionsEx'] = {};
  spec.definition.components.examples.ListSubmissionsEx['value'] = listSubmissions;
};

const swaggerSpec = swaggerJsdoc(getSpec());
module.exports = swaggerSpec;
