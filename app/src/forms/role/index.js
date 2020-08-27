const routes = require('./routes');

module.exports.mount = (app) => {
  const p = '/roles';
  app.use(p, routes);
  return p;
};
