const swaggerJsdoc = require('swagger-jsdoc');
const config = require('config');
const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs');
const { version } = require('../../package.json');

const getSpec = () => {
  const rawSpec = fs.readFileSync(path.join(__dirname, '../swagger/swagger_api_doc.yaml'), 'utf8');
  const spec = yaml.load(rawSpec);
  spec.definition.info.version = version;
  spec.definition.servers[0].url = `${config.get('server.basePath')}/api/v1`;
  spec.definition.components.securitySchemes.openId.openIdConnectUrl = `${config.get('server.keycloak.serverUrl')}/realms/${config.get(
    'server.keycloak.realm'
  )}/.well-known/openid-configuration`;

  return spec;
};

const swaggerSpec = swaggerJsdoc(getSpec());
module.exports = swaggerSpec;
