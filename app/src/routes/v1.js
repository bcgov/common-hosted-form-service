const config = require('config');
const fs = require('fs');
const path = require('path');
const router = require('express').Router();
const yaml = require('js-yaml');

const admin = require('../forms/admin');
const bcgeoaddress = require('../forms/bcgeoaddress');
const file = require('../forms/file');
const form = require('../forms/form');
const permission = require('../forms/permission');
const rbac = require('../forms/rbac');
const role = require('../forms/role');
const user = require('../forms/user');
const submission = require('../forms/submission');
const utils = require('../forms/utils');
const index = require('../forms/public');

admin.mount(router);
const bcaddress = bcgeoaddress.mount(router);
const filePath = file.mount(router);
const formPath = form.mount(router);
const permissionPath = permission.mount(router);
const rbacPath = rbac.mount(router);
const rolePath = role.mount(router);
const userPath = user.mount(router);
const submissionPath = submission.mount(router);
const utilsPath = utils.mount(router);
const publicPath = index.mount(router);

const getSpec = () => {
  const rawSpec = fs.readFileSync(path.join(__dirname, '../docs/v1.api-spec.yaml'), 'utf8');
  const spec = yaml.load(rawSpec);
  spec.servers[0].url = `${config.get('server.basePath')}/api/v1`;
  spec.components.securitySchemes.OpenID.openIdConnectUrl = `${config.get('server.keycloak.serverUrl')}/realms/${config.get(
    'server.keycloak.realm'
  )}/.well-known/openid-configuration`;
  return spec;
};

// Base v1 Responder
router.get('/', (_req, res) => {
  res.status(200).json({
    endpoints: ['/docs', filePath, formPath, permissionPath, rbacPath, rolePath, submissionPath, userPath, bcaddress, publicPath, utilsPath],
  });
});

/** OpenAPI Docs */
router.get('/docs', (_req, res) => {
  const docs = require('../docs/docs');
  res.send(docs.getDocHTML('v1'));
});

/** OpenAPI YAML Spec */
router.get('/api-spec.yaml', (_req, res) => {
  res.status(200).type('application/yaml').send(yaml.dump(getSpec()));
});

/** OpenAPI JSON Spec */
router.get('/api-spec.json', (_req, res) => {
  res.status(200).json(getSpec());
});

module.exports = router;
