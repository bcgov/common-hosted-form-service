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

routes.get('/:formId/eventStreamConfig', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.readEventStreamConfig(req, res, next);
});

routes.post('/:formId/eventStreamConfig', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.createEventStreamConfig(req, res, next);
});

routes.put('/:formId/eventStreamConfig', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.updateEventStreamConfig(req, res, next);
});

routes.delete('/:formId/eventStreamConfig', rateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.deleteEventStreamConfig(req, res, next);
});

module.exports = routes;
