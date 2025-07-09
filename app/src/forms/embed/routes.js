const routes = require('express').Router();
const controller = require('./controller');
const { currentUser, hasFormPermissions } = require('../auth/middleware/userAccess');
const P = require('../common/constants').Permissions;
const validateParameter = require('../common/middleware/validateParameter');

routes.use(currentUser);

routes.param('formId', validateParameter.validateFormId);
routes.param('formEmbedDomainId', validateParameter.validateFormEmbedDomainId);

// List domains for a form
routes.get('/:formId/embed', hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.listDomains(req, res, next);
});

// Request a domain to be added to allowed domains
routes.post('/:formId/embed', hasFormPermissions([P.FORM_UPDATE]), async (req, res, next) => {
  await controller.requestDomain(req, res, next);
});

// Remove a domain from allowed list
routes.delete('/:formId/embed/:formEmbedDomainId', hasFormPermissions([P.FORM_UPDATE]), async (req, res, next) => {
  await controller.removeDomain(req, res, next);
});

// List status history for a domain
routes.get('/:formId/embed/:formEmbedDomainId/history', hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.getDomainHistory(req, res, next);
});

module.exports = routes;
