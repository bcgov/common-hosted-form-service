const routes = require('express').Router();
const controller = require('./controller');

const currentUser = require('../auth/middleware/userAccess').currentUser;
const fileUpload = require('./middleware/upload').fileUpload;
const filePerms = require('./middleware/filePermissions');
const middleware = require('../common/middleware');
const P = require('../common/constants').Permissions;

routes.use(currentUser);

routes.post('/', middleware.publicRateLimiter, filePerms.hasFileCreate, fileUpload.upload, async (req, res, next) => {
  await controller.create(req, res, next);
});

routes.get('/:id', filePerms.currentFileRecord, filePerms.hasFilePermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.delete('/:id', filePerms.currentFileRecord, filePerms.hasFilePermissions(P.SUBMISSION_UPDATE), async (req, res, next) => {
  await controller.delete(req, res, next);
});

module.exports = routes;
