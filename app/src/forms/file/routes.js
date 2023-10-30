const routes = require('express').Router();
const controller = require('./controller');
const apiAccess = require('../auth/middleware/apiAccess');

const P = require('../common/constants').Permissions;
const { currentFileRecord, hasFileCreate, hasFilePermissions } = require('./middleware/filePermissions');
const middleware = require('../common/middleware');
const fileUpload = require('./middleware/upload').fileUpload;
const { currentUser } = require('../auth/middleware/userAccess');

routes.use(currentUser);

routes.post('/', middleware.publicRateLimiter, hasFileCreate, fileUpload.upload, async (req, res, next) => {
  await controller.create(req, res, next);
});

routes.get('/:id', apiAccess, currentFileRecord, hasFilePermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.delete('/:id', currentFileRecord, hasFilePermissions(P.SUBMISSION_UPDATE), async (req, res, next) => {
  await controller.delete(req, res, next);
});

module.exports = routes;
