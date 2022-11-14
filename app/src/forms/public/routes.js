const routes = require('express').Router();
const controller = require('./controller');

routes.get('/reminder', async (req, res, next) => {
  await controller.sendReminderToSubmitter(req, res, next);
});

module.exports = routes;
