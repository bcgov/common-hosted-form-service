const routes = require('express').Router();
const { currentUser, hasFormPermissions } = require('../../auth/middleware/userAccess');
const validateParameter = require('../../common/middleware/validateParameter');
const { featureFlags } = require('../../../components/featureFlags');
const apiAccess = require('../auth/middleware/apiAccess');
const rateLimiter = require('../common/middleware').apiKeyRateLimiter;
const P = require('../../common/constants').Permissions;

const controller = require('./controller');

routes.use(featureFlags.eventStreamServiceEnabled());
routes.use(currentUser);

routes.param('formId', validateParameter.validateFormId);
routes.param('formEncryptionKeyId', validateParameter.validateFormEncryptionKeyId);

routes.get('/encryptionKey/algorithms', rateLimiter, apiAccess, async (req, res, next) => {
  await controller.listEncryptionAlgorithms(req, res, next);
});

routes.get('/:formId/encryptionKey', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.listEncryptionKeys(req, res, next);
});

routes.post('/:formId/encryptionKey', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.createEncryptionKey(req, res, next);
});

routes.get('/:formId/encryptionKey/:formEncryptionKeyId', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.readEncryptionKey(req, res, next);
});

routes.put('/:formId/encryptionKey/:formEncryptionKeyId', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.updateEncryptionKey(req, res, next);
});

routes.delete('/:formId/encryptionKey/:formEncryptionKeyId', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.deleteEncryptionKey(req, res, next);
});

module.exports = routes;
