const router = require('express').Router();
const yaml = require('js-yaml');
const swaggerSpec = require('../swagger/swaggerui');

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
  res.status(200).type('application/yaml').send(yaml.dump(swaggerSpec));
});

module.exports = router;
