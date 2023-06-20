const swaggerJsdoc = require('swagger-jsdoc');
const config = require('config');
const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs');
const { version } = require('../../package.json');
const chefsRoles = require('../swagger/responses/chefRolesPermissions.json');
const submission = require('../swagger/responses/submission.json');
const deletedsubmission = require('../swagger/responses/deletedsubmission.json');
const updateForm = require('../swagger/responses/updateForm.json');
const createForm = require('../swagger/responses/createForm.json');
const formDraft = require('../swagger/responses/formDraft.json');
const formVersion = require('../swagger/responses/formVersion.json');
const createFormSubmission = require('../swagger/responses/createFormSubmission.json');
const publishFormVersion = require('../swagger/responses/publishFormVersion.json');
const rbacCurrent = require('../swagger/responses/rbacCurrent.json');
const rbacUsers = require('../swagger/responses/rbacUsers.json');
const rbacFormSubmission = require('../swagger/responses/rbacFormSubmission.json');
const createFormReq = require('../swagger/requests/createFormReq.json');
//const updateFormReq = require('../swagger/requests/updateFormReq.json');

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
  spec.definition.components.examples['CHEFSRolesPermissionsEx'] = {};
  spec.definition.components.examples.CHEFSRolesPermissionsEx['value'] = yaml.load(yaml.dump(chefsRoles));

  //submission example
  spec.definition.components.examples['SubmissionEx'] = {};
  spec.definition.components.examples.SubmissionEx['value'] = yaml.load(yaml.dump(submission));

  //deleted submission example
  spec.definition.components.examples['DeletedSubmissionEx'] = {};
  spec.definition.components.examples.DeletedSubmissionEx['value'] = yaml.load(yaml.dump(deletedsubmission));

  //create form example
  spec.definition.components.examples['CreateFormEx'] = {};
  spec.definition.components.examples.CreateFormEx['value'] = yaml.load(yaml.dump(createForm));

  //update form example
  spec.definition.components.examples['UpdateFormEx'] = {};
  spec.definition.components.examples.UpdateFormEx['value'] = yaml.load(yaml.dump(updateForm));

  //create form draft example
  spec.definition.components.examples['FormDraftEx'] = {};
  spec.definition.components.examples.FormDraftEx['value'] = yaml.load(yaml.dump(formDraft));

  //create form version example
  spec.definition.components.examples['FormVersionEx'] = {};
  spec.definition.components.examples.FormVersionEx['value'] = yaml.load(yaml.dump(formVersion));

  //create form submission example
  spec.definition.components.examples['CreateFormSubmissionEx'] = {};
  spec.definition.components.examples.CreateFormSubmissionEx['value'] = yaml.load(yaml.dump(createFormSubmission));

  //create form submission example
  spec.definition.components.examples['PublishFormVersionEx'] = {};
  spec.definition.components.examples.PublishFormVersionEx['value'] = yaml.load(yaml.dump(publishFormVersion));

  //create form submission example
  spec.definition.components.examples['RBACCurrentEx'] = {};
  spec.definition.components.examples.RBACCurrentEx['value'] = yaml.load(yaml.dump(rbacCurrent));

  //create form submission example
  spec.definition.components.examples['RBACUsersEx'] = {};
  spec.definition.components.examples.RBACUsersEx['value'] = yaml.load(yaml.dump(rbacUsers));

  //create form submission example
  spec.definition.components.examples['RBACFormSubmissionEx'] = {};
  spec.definition.components.examples.RBACFormSubmissionEx['value'] = yaml.load(yaml.dump(rbacFormSubmission));

  //create form example for requestbody in /forms/ POST endpoint
  spec.definition.components.schemas['CreateForm'] = yaml.load(yaml.dump(createFormReq));

  //update form example for requestbody in /forms/:formId PUT endpoint
  //spec.definition.components.schemas['UpdateForm'] = yaml.load(yaml.dump(updateFormReq));
};

const swaggerSpec = swaggerJsdoc(getSpec());
module.exports = swaggerSpec;
