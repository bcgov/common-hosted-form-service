const routes = require('express').Router();

const apiAccess = require('./middleware/apiAccess');
const controller = require('./controller');

routes.get('/reminder', apiAccess.checkApiKey, async (req, res, next) => {
  await controller.sendReminderToSubmitter(req, res, next);
});

module.exports = routes;
