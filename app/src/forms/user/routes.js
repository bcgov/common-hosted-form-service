const routes = require('express').Router();
const controller = require('./controller');

const currentUser = require('../auth/middleware/userAccess').currentUser;
const keycloak = require('../../components/keycloak');

routes.use(keycloak.protect());
routes.use(currentUser);

//
// User Preferences
// This must be defined before /:userId route to work as intended
//

/**
 * @openapi
 * users/preferences:
 *  get:
 *    tags:
 *      - Users
 *    description: This endpoint will fetch list of current user preferences for all the forms
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/UserReadUserPreferences'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 */
routes.get('/preferences', async (req, res, next) => {
  await controller.readUserPreferences(req, res, next);
});

/*
to review
*/
routes.put('/preferences', async (req, res, next) => {
  await controller.updateUserPreferences(req, res, next);
});

/**
 * @openapi
 * users/preferences:
 *  delete:
 *    tags:
 *      - Users
 *    description: 'This endpoint will delete all the current user preferences. Note: This endpoint will delete all the preferences for all the form.'
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    responses:
 *      '200':
 *        description: Success
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 */
routes.delete('/preferences', async (req, res, next) => {
  await controller.deleteUserPreferences(req, res, next);
});

//
// User
//

/**
 * @openapi
 * users/:
 *  get:
 *    tags:
 *      - Users
 *    description: This endpoint will fetch the list of all users
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/UsersListUsers'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 */
routes.get('/', async (req, res, next) => {
  await controller.list(req, res, next);
});

/*
 * take a look. Not returning what it should
 */
routes.get('/:userId', async (req, res, next) => {
  await controller.read(req, res, next);
});

//
// User Form Preferences
//

/**
 * @openapi
 * users/preferences/forms/{formId}:
 *  get:
 *    tags:
 *      - Users
 *    description: This endpoint will fetch current user preferences for a form
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *        format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/UsersReadUserFormPreferences'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 */
routes.get('/preferences/forms/:formId', async (req, res, next) => {
  await controller.readUserFormPreferences(req, res, next);
});

/**
 * @openapi
 * users/preferences/forms/{formId}:
 *  put:
 *    tags:
 *      - Users
 *    description: This endpoint will update current user preferences for a form.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *        format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              columns:
 *                type: array
 *                example: ['fisherName', 'email']
 *                description: selected submissions fields
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/UsersUpdateUserFormPreferences'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 */
routes.put('/preferences/forms/:formId', async (req, res, next) => {
  await controller.updateUserFormPreferences(req, res, next);
});

/**
 * @openapi
 * users/preferences/forms/{formId}:
 *  delete:
 *    tags:
 *      - Users
 *    description: This endpoint will delete current user preferences for a form.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *        format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 */
routes.delete('/preferences/forms/:formId', async (req, res, next) => {
  await controller.deleteUserFormPreferences(req, res, next);
});

module.exports = routes;
