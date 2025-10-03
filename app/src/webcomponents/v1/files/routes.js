const routes = require('express').Router();

const validateParameter = require('../../../forms/common/middleware/validateParameter');
const apiAccess = require('../../../forms/auth/middleware/apiAccess');
const gatewayTokenVerify = require('../../common/middleware/gatewayTokenVerify');
const originAccess = require('../../common/middleware/originAccess');

const P = require('../../../forms/common/constants').Permissions;
const controller = require('../../../forms/file/controller');
const { currentFileRecord, hasFileCreate, hasFileDelete, hasFilePermissions } = require('../../../forms/file/middleware/filePermissions');
const fileUpload = require('../../../forms/file/middleware/upload').fileUpload;
const virusScan = require('../../../forms/file/middleware/virusScan');

routes.param('fileId', validateParameter.validateFileId);

// File endpoints for web component
// Order: apiAccess -> gatewayTokenVerify -> originAccess -> handler (CORS applied at router level)
routes.get('/:fileId', apiAccess, gatewayTokenVerify, originAccess, currentFileRecord, hasFilePermissions([P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.get('/:fileId/clone', apiAccess, gatewayTokenVerify, originAccess, currentFileRecord, hasFilePermissions([P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.clone(req, res, next);
});

routes.delete('/:fileId', apiAccess, gatewayTokenVerify, originAccess, currentFileRecord, hasFilePermissions([P.SUBMISSION_UPDATE]), async (req, res, next) => {
  await controller.delete(req, res, next);
});

routes.delete('/', apiAccess, gatewayTokenVerify, originAccess, hasFileDelete, async (req, res, next) => {
  await controller.deleteFiles(req, res, next);
});

routes.post('/', apiAccess, gatewayTokenVerify, originAccess, hasFileCreate, fileUpload.upload, virusScan.scanFile, async (req, res, next) => {
  await controller.create(req, res, next);
});

module.exports = routes;
