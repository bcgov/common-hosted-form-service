const dataErrors = require('../common/middleware').dataErrors;
const routes = require('./routes');

module.exports.mount = (app) => {
  const p = '/permissions';
  app.use(p, routes);
  app.use(dataErrors);
  return p;
};
