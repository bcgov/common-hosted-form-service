const routes = require('express').Router();

const basicApiAccess = require('../auth/middleware/apiAccess');
const { currentUser } = require('../auth/middleware/userAccess');
const P = require('../common/constants').Permissions;
const validateParameter = require('../common/middleware/validateParameter');
const controller = require('./controller');
const { currentFileRecord, hasFileCreate, hasFileDelete, hasFilePermissions } = require('./middleware/filePermissions');
const fileUpload = require('./middleware/upload').fileUpload;
const virusScan = require('./middleware/virusScan');

routes.use(currentUser);

routes.param('fileId', validateParameter.validateFileId);
// Initialize Multer to expect the 'files' field from FormData
fileUpload.init({ fieldName: 'files' });

routes.post('/', hasFileCreate, fileUpload.upload, virusScan.scanFile, async (req, res, next) => {
  await controller.create(req, res, next);
});

routes.delete('/', hasFileDelete, async (req, res, next) => {
  await controller.deleteFiles(req, res, next);
});

// Auth chain for the /:fileId routes (runs top to bottom):
//   1. currentUser (added by routes.use above) - if a Bearer token is sent it must
//      be valid (else 401); no token just means the request continues as a public user.
//   2. basicApiAccess - only acts on "Authorization: Basic <formId:apiKey>". Valid
//      Basic creds set req.apiUser (API access to protected forms, honours the form's
//      filesApiAccess flag); bad creds are rejected (401). Anything that isn't Basic
//      (public, Bearer) is left alone and falls through.
//   3. currentFileRecord - loads the file row, or 403s if it can't be found.
//   4. hasFilePermissions - the real gate:
//        - req.apiUser  -> allowed.
//        - draft file (no submissionId yet) -> allowed, so a public submitter can
//          read/delete their own upload before the form is submitted.
//        - submitted file + public user -> 403.
//        - submitted file + logged-in user -> checked against submission permissions
//          (public forms still allow SUBMISSION_READ).
routes.get('/:fileId', basicApiAccess, currentFileRecord, hasFilePermissions([P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.get('/:fileId/clone', basicApiAccess, currentFileRecord, hasFilePermissions([P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.clone(req, res, next);
});

routes.delete('/:fileId', basicApiAccess, currentFileRecord, hasFilePermissions([P.SUBMISSION_UPDATE]), async (req, res, next) => {
  await controller.delete(req, res, next);
});

module.exports = routes;
