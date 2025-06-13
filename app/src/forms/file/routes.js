const routes = require('express').Router();

const apiAccess = require('../auth/middleware/apiAccess');
const { currentUser } = require('../auth/middleware/userAccess');
const P = require('../common/constants').Permissions;
const validateParameter = require('../common/middleware/validateParameter');
const controller = require('./controller');
const { currentFileRecord, hasFileCreate, hasFileDelete, hasFilePermissions } = require('./middleware/filePermissions');
const fileUpload = require('./middleware/upload').fileUpload;
const virusScan = require('./middleware/virusScan');

routes.use(currentUser);

routes.param('fileId', validateParameter.validateFileId);

routes.post('/', hasFileCreate, fileUpload.upload, virusScan.scanFile, async (req, res, next) => {
  await controller.create(req, res, next);
});

routes.delete('/', hasFileDelete, async (req, res, next) => {
  await controller.deleteFiles(req, res, next);
});

routes.get('/:fileId', apiAccess, currentFileRecord, hasFilePermissions([P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.get('/:fileId/clone', apiAccess, currentFileRecord, hasFilePermissions([P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.clone(req, res, next);
});

routes.delete('/:fileId', currentFileRecord, hasFilePermissions([P.SUBMISSION_UPDATE]), async (req, res, next) => {
  await controller.delete(req, res, next);
});

module.exports = routes;
