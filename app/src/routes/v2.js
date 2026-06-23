const config = require('config');
const fs = require('node:fs');
const path = require('node:path');
const router = require('express').Router();
const yaml = require('js-yaml');

const submission = require('../v2/forms/submission');
const utils = require('../v2/forms/utils');

const statusService = require('../components/statusService');

const submissionPath = submission.mount(router);
const utilsPath = utils.mount(router);

const getSpec = () => {
  const rawSpec = fs.readFileSync(path.join(__dirname, '../docs/v2.api-spec.yaml'), 'utf8');
  const spec = yaml.load(rawSpec);
  spec.servers[0].url = `${config.get('server.basePath')}/api/v2`;
  spec.components.securitySchemes.OpenID.openIdConnectUrl = `${config.get('server.oidc.serverUrl')}/realms/${config.get('server.oidc.realm')}/.well-known/openid-configuration`;
  return spec;
};

router.get('/', (_req, res) => {
  res.status(200).json({
    endpoints: [submissionPath, utilsPath],
  });
});

/** OpenAPI Docs */
router.get('/docs', (_req, res) => {
  const docs = require('../docs/docs');
  res.send(docs.getDocHTML('v2'));
});

/** OpenAPI YAML Spec */
router.get('/api-spec.yaml', (_req, res) => {
  res.status(200).type('application/yaml').send(yaml.dump(getSpec()));
});

/** OpenAPI JSON Spec */
router.get('/api-spec.json', (_req, res) => {
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
