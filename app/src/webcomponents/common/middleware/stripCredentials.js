// Anonymous routes ignore credentials a host page passes along, so they never
// decide access and the host user's identity never reaches the request logs.
const CREDENTIAL_HEADERS = ['authorization', 'x-chefs-gateway-token'];

module.exports = function stripCredentials(req, _res, next) {
  for (const name of CREDENTIAL_HEADERS) {
    delete req.headers[name];
  }
  next();
};
