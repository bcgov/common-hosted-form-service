/**
 * Records Management Module
 */

const setupMount = require('../common/utils').setupMount;
const routes = require('./routes');

const _PATH = 'recordsManagement';

module.exports.mount = (app) => {
  return setupMount(_PATH, app, routes);
};
