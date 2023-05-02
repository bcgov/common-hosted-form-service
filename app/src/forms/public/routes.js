const routes = require('express').Router();
const controller = require('./controller');

routes.use('/reminder', (req, res, next) => {
  // eslint-disable-next-line no-empty
  try {
    if (req.method == 'GET') {
      const apikeyEnv = process.env.APITOKEN;
      const apikeyIncome = req.headers.apikey;
      if (apikeyEnv == apikeyIncome && (apikeyIncome == undefined || apikeyIncome == '')) return res.status(401).json({ message: 'No API key provided' });
      if (apikeyIncome === apikeyEnv) {
        next();
      } else {
        return res.status(401).json({ message: 'Invalid API key' });
      }
    } else {
      return res.status(404).json({ message: 'Only GET request is accepted' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

routes.get('/reminder', async (req, res, next) => {
  await controller.sendReminderToSubmitter(req, res, next);
});

module.exports = routes;
