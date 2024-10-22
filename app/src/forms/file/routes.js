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

routes.post('/', hasFileCreate, fileUpload.upload, async (req, res, next) => {
  await controller.create(req, res, next);
});

routes.get('/:fileId', apiAccess, currentFileRecord, hasFilePermissions([P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.delete('/:fileId', currentFileRecord, hasFilePermissions([P.SUBMISSION_UPDATE]), async (req, res, next) => {
  await controller.delete(req, res, next);
});

// FORMS-1138: Add a temporary route that can be called with a submission ID to
// fix any files that are stuck in the "uploads" directory. This will be removed
// once all the files have been moved into the proper submissions directory.
routes.post('/tempfix/:submissionId', async (req, res, next) => {
  await controller.tempfix(req, res, next);
});

module.exports = routes;
