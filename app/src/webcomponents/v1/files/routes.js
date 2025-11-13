const routes = require('express').Router();

const validateParameter = require('../../../forms/common/middleware/validateParameter');
const { AuthCombinations, hasFileCreate, hasFilePermissions } = require('../../../runtime-auth/security');
const chefSecurity = require('../../common/security');
const originAccess = require('../../common/middleware/originAccess');

const P = require('../../../forms/common/constants').Permissions;
const controller = require('../../../forms/file/controller');
const fileUpload = require('../../../forms/file/middleware/upload').fileUpload;
const virusScan = require('../../../forms/file/middleware/virusScan');

routes.param('fileId', validateParameter.validateFileId);

// File endpoints for web component
// Order: runtime-auth -> originAccess -> filePermissions -> handler (CORS applied at router level)
routes.get(
  '/:fileId',
  chefSecurity.inline({
    allowedAuth: AuthCombinations.API_ONLY,
    requiredPermissions: [P.SUBMISSION_READ],
    resourceSpec: { kind: 'file' }, // Auto-infer fileId from req.params
  }),
  originAccess,
  hasFilePermissions([P.SUBMISSION_READ]),
  async (req, res, next) => {
    await controller.read(req, res, next);
  }
);

routes.delete(
  '/:fileId',
  chefSecurity.inline({
    allowedAuth: AuthCombinations.API_ONLY,
    requiredPermissions: [P.SUBMISSION_UPDATE],
    resourceSpec: { kind: 'file' }, // Auto-infer fileId from req.params
  }),
  originAccess,
  hasFilePermissions([P.SUBMISSION_UPDATE]),
  async (req, res, next) => {
    await controller.delete(req, res, next);
  }
);

routes.post(
  '/',
  chefSecurity.inline({
    allowedAuth: AuthCombinations.API_ONLY,
    resourceSpec: { kind: 'formOnly' }, // Will auto-infer formId from req.query.formId
    requiredPermissions: [],
  }),
  originAccess,
  hasFileCreate,
  fileUpload.upload,
  virusScan.scanFile,
  async (req, res, next) => {
    await controller.create(req, res, next);
  }
);

module.exports = routes;
