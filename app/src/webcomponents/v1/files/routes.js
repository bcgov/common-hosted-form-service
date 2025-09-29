const routes = require('express').Router();

const cors = require('cors');

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
// Order: cors -> apiAccess -> gatewayTokenVerify -> originAccess -> handler
routes.get('/:fileId', cors(), apiAccess, gatewayTokenVerify, originAccess, currentFileRecord, hasFilePermissions([P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.get('/:fileId/clone', cors(), apiAccess, gatewayTokenVerify, originAccess, currentFileRecord, hasFilePermissions([P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.clone(req, res, next);
});

routes.delete('/:fileId', cors(), apiAccess, gatewayTokenVerify, originAccess, currentFileRecord, hasFilePermissions([P.SUBMISSION_UPDATE]), async (req, res, next) => {
  await controller.delete(req, res, next);
});

routes.delete('/', cors(), apiAccess, gatewayTokenVerify, originAccess, hasFileDelete, async (req, res, next) => {
  await controller.deleteFiles(req, res, next);
});

routes.post('/', cors(), apiAccess, gatewayTokenVerify, originAccess, hasFileCreate, fileUpload.upload, virusScan.scanFile, async (req, res, next) => {
  await controller.create(req, res, next);
});

module.exports = routes;
