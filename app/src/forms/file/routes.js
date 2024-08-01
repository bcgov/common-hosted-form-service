const routes = require('express').Router();
const controller = require('./controller');
const apiAccess = require('../auth/middleware/apiAccess');
const validateParameter = require('../common/middleware/validateParameter');

const P = require('../common/constants').Permissions;
const { currentFileRecord, hasFileCreate, hasFilePermissions } = require('./middleware/filePermissions');
const fileUpload = require('./middleware/upload').fileUpload;
const { currentUser } = require('../auth/middleware/userAccess');
const rateLimiter = require('../common/middleware').apiKeyRateLimiter;

routes.use(currentUser);

routes.param('fileId', validateParameter.validateFileId);

routes.post('/', hasFileCreate, fileUpload.upload, async (req, res, next) => {
  await controller.create(req, res, next);
});

routes.get('/:fileId', rateLimiter, apiAccess, currentFileRecord, hasFilePermissions([P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.delete('/:fileId', currentFileRecord, hasFilePermissions([P.SUBMISSION_UPDATE]), async (req, res, next) => {
  await controller.delete(req, res, next);
});

module.exports = routes;
