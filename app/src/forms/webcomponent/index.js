const routes = require('./routes');
const setupMount = require('../common/utils').setupMount;

module.exports.mount = (app) => {
  const p = setupMount('webcomponent', app, [routes]);
  return p;
};
