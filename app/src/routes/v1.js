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
const proxy = require('../forms/proxy');
const commonServices = require('../forms/commonServices');

const statusService = require('../components/statusService');

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
const proxyPath = proxy.mount(router);
const commonServicesPath = commonServices.mount(router);

const getSpec = () => {
  const rawSpec = fs.readFileSync(path.join(__dirname, '../docs/v1.api-spec.yaml'), 'utf8');
  const spec = yaml.load(rawSpec);
  spec.servers[0].url = `${config.get('server.basePath')}/api/v1`;
  spec.components.securitySchemes.OpenID.openIdConnectUrl = `${config.get('server.oidc.serverUrl')}/realms/${config.get('server.oidc.realm')}/.well-known/openid-configuration`;
  return spec;
};

// Base v1 Responder
router.get('/', (_req, res) => {
  res.status(200).json({
    endpoints: [
      '/docs',
      '/status',
      proxyPath,
      filePath,
      formPath,
      permissionPath,
      rbacPath,
      rolePath,
      submissionPath,
      userPath,
      bcaddress,
      publicPath,
      utilsPath,
      commonServicesPath,
    ],
  });
});

/** OpenAPI Docs */
router.get('/docs', (req, res) => {
  const docs = require('../docs/docs');
  // Set CORS headers to allow ReDoc to fetch the spec
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.redoc.ly; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;"
  );
  res.send(docs.getDocHTML('v1', req));
});

/** OpenAPI YAML Spec */
router.get('/api-spec.yaml', (_req, res) => {
  // Set CORS headers to allow ReDoc to fetch the spec
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).type('application/yaml').send(yaml.dump(getSpec()));
});

/** OpenAPI JSON Spec */
router.get('/api-spec.json', (_req, res) => {
  // Set CORS headers to allow ReDoc to fetch the spec
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(getSpec());
});

router.get('/status', (_req, res, next) => {
  try {
    const status = statusService.getStatus();
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
