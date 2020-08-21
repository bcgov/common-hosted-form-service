const config = require('config');
const Keycloak = require('keycloak-connect');

module.exports = new Keycloak({}, {
  bearerOnly: true,
  'confidential-port': 0,
  clientId: config.get('server.keycloak.clientId'),
  'policy-enforcer': {},
  realm: config.get('server.keycloak.realm'),
  secret: config.get('server.keycloak.clientSecret'),
  serverUrl: config.get('server.keycloak.serverUrl'),
  'ssl-required': 'external',
  'use-resource-role-mappings': true,
  'verify-token-audience': false
});
