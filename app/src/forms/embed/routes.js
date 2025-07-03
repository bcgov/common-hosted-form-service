const routes = require('express').Router();
const controller = require('./controller');
const { currentUser, hasFormPermissions } = require('../auth/middleware/userAccess');
const P = require('../common/constants').Permissions;
const validateParameter = require('../common/middleware/validateParameter');

routes.use(currentUser);

routes.param('formId', validateParameter.validateFormId);
routes.param('requestId', validateParameter.validateRequestId);
routes.param('domainId', validateParameter.validateDomainId);

// List allowed domains for a form
routes.get('/:formId/embed/allowed', hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.listAllowedDomains(req, res, next);
});

// List requested domains for a form
routes.get('/:formId/embed/requested', hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.listRequestedDomains(req, res, next);
});

// Request a domain to be added to allowed domains
routes.post('/:formId/embed/request', hasFormPermissions([P.FORM_UPDATE]), async (req, res, next) => {
  await controller.requestDomain(req, res, next);
});

// Review a domain request (admin only)
routes.put('/:formId/embed/request/:requestId', hasFormPermissions([P.FORM_UPDATE]), async (req, res, next) => {
  await controller.reviewDomainRequest(req, res, next);
});

// Remove a domain from allowed list
routes.delete('/:formId/embed/allowed/:domainId', hasFormPermissions([P.FORM_UPDATE]), async (req, res, next) => {
  await controller.removeDomain(req, res, next);
});

module.exports = routes;
