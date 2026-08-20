const routes = require('express').Router();

const apiAccess = require('../public/middleware/apiAccess');
const controller = require('./controller');

// Public read endpoints. Feature configuration (allowlists, allowAll) is mutated
// only through the admin module, which is guarded by jwtService.protect('admin').

routes.get('/', async (req, res, next) => {
  await controller.listFeatures(req, res, next);
});

routes.get('/check', async (req, res, next) => {
  await controller.check(req, res, next);
});

// Internal: process queued submitToEmail package jobs. Called by cron via curl
// with an apikey header (same pattern as /public/reminder and the records
// deletion job).
routes.post('/submitToEmail/process', apiAccess.checkApiKey, async (req, res, next) => {
  await controller.processSubmissionPackages(req, res, next);
});

module.exports = routes;
