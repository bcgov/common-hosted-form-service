const config = require('config');
const routes = require('express').Router();

const currentUser = require('../auth/middleware/userAccess').currentUser;

const controller = require('./controller');
const keycloak = require('../../components/keycloak');

routes.use(currentUser);

/**
 * @openapi
 * admin/roles/:
 *  get:
 *    tags:
 *      - Roles
 *    description: Get a list of all users
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            examples:
 *              CHEFSRolesPermissionsEx:
 *                $ref: '#/components/examples/CHEFSRolesPermissionsEx'
 *            schema:
 *              type: array
 *              description: returns a list of permissions. See the example for more
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 */
routes.get('/', keycloak.protect(), async (req, res, next) => {
  await controller.list(req, res, next);
});

routes.post('/', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.create(req, res, next);
});

routes.get('/:code', keycloak.protect(), async (req, res, next) => {
  await controller.read(req, res, next);
});

routes.put('/:code', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.update(req, res, next);
});

module.exports = routes;
