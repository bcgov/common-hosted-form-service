const dataErrors = require('../common/middleware').dataErrors;
const routes = require('./routes');
const setupMount = require('../common/utils').setupMount;

module.exports.mount = (app) => {
  return setupMount('form_modules', app, routes, dataErrors);
};
