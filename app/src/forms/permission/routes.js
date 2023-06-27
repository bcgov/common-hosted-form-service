const config = require('config');
const routes = require('express').Router();

const currentUser = require('../auth/middleware/userAccess').currentUser;

const controller = require('./controller');
const keycloak = require('../../components/keycloak');

routes.use(keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`));
routes.use(currentUser);

/**
 * @openapi
 * /permission/:
 *  get:
 *    tags:
 *      - Permissions
 *    description: This endpoint will fetch list of permissions and roles they are attached to.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *           schema:
 *              $ref: '#/components/responses/responseBody/PermissionsexPermissions'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 */
routes.get('/', async (req, res, next) => {
  await controller.list(req, res, next);
});

/**
 * @openapi
 * /permission/:
 *  post:
 *    tags:
 *      - Permissions
 *    description: This endpoint will create a new permission
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/PermissionsReqObjPermission'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *           schema:
 *              $ref: '#/components/responses/responseBody/PermissionsexPermissions'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 */
routes.post('/', async (req, res, next) => {
  await controller.create(req, res, next);
});

/**
 * @openapi
 * /permission/:code/:
 *  get:
 *    tags:
 *      - Permissions
 *    description: This endpoint will fetch the permission using the permission code in the parameter.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: code
 *        schema:
 *          type: string
 *        description: code of the permisssion to create.
 *        required: true
 *        example: design_update
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *           schema:
 *              $ref: '#/components/responses/responseBody/PermissionsexPermissions'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 */
routes.get('/:code', async (req, res, next) => {
  await controller.read(req, res, next);
});

/**
 * @openapi
 * /permission/:code/:
 *  put:
 *    tags:
 *      - Permissions
 *    description: This endpoint will update the permission.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: code
 *        schema:
 *          type: string
 *        description: code of the permisssion to update.
 *        required: true
 *        example: design_update
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/PermissionsReqObjPermission'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *           schema:
 *              $ref: '#/components/responses/responseBody/PermissionsexPermissions'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 */
routes.put('/:code', async (req, res, next) => {
  await controller.update(req, res, next);
});

module.exports = routes;
