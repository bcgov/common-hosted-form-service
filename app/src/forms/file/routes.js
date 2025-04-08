const routes = require('express').Router();

const apiAccess = require('../auth/middleware/apiAccess');
const { currentUser } = require('../auth/middleware/userAccess');
const P = require('../common/constants').Permissions;
const validateParameter = require('../common/middleware/validateParameter');
const controller = require('./controller');
const { currentFileRecord, hasFileCreate, hasFilePermissions } = require('./middleware/filePermissions');
const fileUpload = require('./middleware/upload').fileUpload;

routes.use(currentUser);

routes.param('fileId', validateParameter.validateFileId);
// Initialize Multer to expect the 'file' field from FormData
fileUpload.init({ fieldName: 'file' });

routes.post('/', hasFileCreate, fileUpload.upload, async (req, res, next) => {
  await controller.create(req, res, next);
});

routes.get('/:fileId', apiAccess, currentFileRecord, hasFilePermissions([P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.delete('/:fileId', currentFileRecord, hasFilePermissions([P.SUBMISSION_UPDATE]), async (req, res, next) => {
  await controller.delete(req, res, next);
});

module.exports = routes;
