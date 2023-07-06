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
 * /users/preferences:
 *  get:
 *    tags:
 *      - Users
 *    summary: Get the preferences for current user
 *    description: This endpoint will fetch list of current user preferences for all the forms
 *    security:
 *      - bearerAuth: []
 *        openId: []
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/UserReadUserPreferences'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
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
 * /users/preferences:
 *  delete:
 *    tags:
 *      - Users
 *    summary: Delete all preferences for current user
 *    description: 'This endpoint will delete all the current user preferences. Note: This endpoint will delete all the preferences for all the form.'
 *    security:
 *      - bearerAuth: []
 *        openId: []
 *    responses:
 *      '200':
 *        description: Success
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.delete('/preferences', async (req, res, next) => {
  await controller.deleteUserPreferences(req, res, next);
});

//
// User
//

/**
 * @openapi
 * /users/:
 *  get:
 *    tags:
 *      - Users
 *    summary: Get a list of users and their roles
 *    description: This endpoint will fetch the list of all users
 *    security:
 *      - bearerAuth: []
 *        openId: []
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/UsersListUsers'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/', async (req, res, next) => {
  await controller.list(req, res, next);
});

/**
 * @openapi
 * /users/{userId}/:
 *  get:
 *    tags:
 *      - Users
 *    summary: Get a user and their roles
 *    description: This endpoint will return user IDP User ID, IDP code, and Keycloak ID.
 *    security:
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: userId
 *        schema:
 *          type: string
 *        format: uuid
 *        description: ID of the user.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                id:
 *                  description: User ID.
 *                  type: string
 *                  format: uuid
 *                  example: a2794923-5a4f-4945-be9c-9655dc2f09c8
 *                idpUserId:
 *                  description: User IDP ID
 *                  format: uuid
 *                  type: string
 *                  example: 085F22D7201D4C1B88BB26970264E1F3
 *                keycloakId:
 *                  type: string
 *                  format: uuid
 *                  description: Keycloak ID.
 *                  example: ea94678c-5f00-42b2-9f56-bd401091fb7c
 *                idpCode:
 *                  type: string
 *                  descriprion: IDP code
 *                  example: idir
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/ResourceNotFound'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:userId', async (req, res, next) => {
  await controller.read(req, res, next);
});

//
// User Form Preferences
//

/**
 * @openapi
 * /users/preferences/forms/{formId}:
 *  get:
 *    tags:
 *      - Users
 *    summary: Get the form preferences for current user
 *    description: This endpoint will fetch current user preferences for a form
 *    security:
 *      - bearerAuth: []
 *        openId: []
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
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 *      '404':
 *        $ref: '#/components/responses/Error/ResourceNotFound'
 */
routes.get('/preferences/forms/:formId', async (req, res, next) => {
  await controller.readUserFormPreferences(req, res, next);
});

/**
 * @openapi
 * /users/preferences/forms/{formId}:
 *  put:
 *    tags:
 *      - Users
 *    summary: Update the form preferences for current user
 *    description: This endpoint will update current user preferences for a form.
 *    security:
 *      - bearerAuth: []
 *        openId: []
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
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 *      '404':
 *        $ref: '#/components/responses/Error/ResourceNotFound'
 */
routes.put('/preferences/forms/:formId', async (req, res, next) => {
  await controller.updateUserFormPreferences(req, res, next);
});

/**
 * @openapi
 * /users/preferences/forms/{formId}:
 *  delete:
 *    tags:
 *      - Users
 *    summary: Delete all form preferences for current user
 *    description: This endpoint will delete current user preferences for a form.
 *    security:
 *      - bearerAuth: []
 *        openId: []
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
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 *      '404':
 *        $ref: '#/components/responses/Error/ResourceNotFound'
 */
routes.delete('/preferences/forms/:formId', async (req, res, next) => {
  await controller.deleteUserFormPreferences(req, res, next);
});

module.exports = routes;
