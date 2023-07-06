const config = require('config');
const routes = require('express').Router();

const currentUser = require('../auth/middleware/userAccess').currentUser;

const controller = require('./controller');
const keycloak = require('../../components/keycloak');

routes.use(currentUser);

/**
 * @openapi
 * /roles/:
 *  get:
 *    tags:
 *      - Roles
 *    summary: List all roles
 *    description: This endpoint will fetch list of roles and permissions.
 *    security:
 *      - bearerAuth: []
 *        openId: []
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *           schema:
 *              $ref: '#/components/responses/responseBody/RolesListRole'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/', keycloak.protect(), async (req, res, next) => {
  await controller.list(req, res, next);
});

/**
 * @openapi
 * /roles/:
 *  post:
 *    tags:
 *      - Roles
 *    summary: Create a new role
 *    description: This endpoint will fetch list of roles and permissions.
 *    security:
 *      - openId: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/RolesReqCreateRole'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *           schema:
 *              $ref: '#/components/responses/responseBody/RolesGetRole'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.post('/', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.create(req, res, next);
});

/**
 * @openapi
 * /roles/code/:
 *  get:
 *    tags:
 *      - Roles
 *    summary: Get a role
 *    description: This endpoint will fetch specified role code.
 *    security:
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: code
 *        schema:
 *          type: string
 *        description: code of the role to fecth
 *        required: true
 *        example: form_designer
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/RolesGetRole'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:code', keycloak.protect(), async (req, res, next) => {
  await controller.read(req, res, next);
});

/**
 * @openapi
 * /roles/:
 *  post:
 *    tags:
 *      - Roles
 *    summary: Update a role
 *    description: This endpoint will fetch list of roles and permissions.
 *    security:
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: code
 *        schema:
 *          type: string
 *        description: code of the role to update.
 *        required: true
 *        example: form_designer
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/RolesReqUpdateRole'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *           schema:
 *              $ref: '#/components/responses/responseBody/RolesGetRole'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.put('/:code', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.update(req, res, next);
});

module.exports = routes;
