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

routes.get('/preferences', async (req, res, next) => {
  await controller.readUserPreferences(req, res, next);
});

routes.put('/preferences', async (req, res, next) => {
  await controller.updateUserPreferences(req, res, next);
});

routes.delete('/preferences', async (req, res, next) => {
  await controller.deleteUserPreferences(req, res, next);
});

//
// User
//

/**
 * @openapi
 * admin/users/:
 *  get:
 *    tags:
 *      - Users
 *    description: Get a list of all users
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: query
 *        name: idpCode
 *        schema:
 *          type: string
 *        description: code for the identity provider.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: query
 *        name: search
 *        schema:
 *          type: string
 *        description: search query value.
 *        required: true
 *        example: ''
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    format: uuid
 *                    description: ID of the User. This Id is from the User table in database.
 *                    example: 7cc11a0f-a7c9-4cbe-bd92-a2a22781ad9f
 *                  keycloakId:
 *                    type: string
 *                    example: ea94678c-5f00-42b2-9f56-bd401091fb8a
 *                    description: Id from the keycloak
 *                  idpUserId:
 *                    type: string
 *                    example: 084F23D7201D4C1B88BB26971264E1F2
 *                    description: IDP id of the user. This is SSO team generated Id
 *                  firstName:
 *                    type: string
 *                    example: George,
 *                    description: User registered firstname.
 *                  username:
 *                    type: string
 *                    example: AODOWI
 *                    description: User login username(can be either IDIR username, Basic BCeID (User Id), or Business BCeID (User Id))
 *                  fullName:
 *                    type: string
 *                    example: George Banner,
 *                    description: User registered fullname.
 *                  lastName:
 *                    type: string
 *                    example: Banner,
 *                    description: User registered lastname.
 *                  email:
 *                    type: string
 *                    example: test@gov.bc.ca,
 *                    description: User registered email on IDP login details (IDIR, Basic BCeID, or Business BCeID)
 *                  idpCode:
 *                    type: string
 *                    example: 'idir'
 *                    description: code for the identity provider e.g. (idir)
 *                  createdBy:
 *                    type: string
 *                    description: The username of the user that created this form
 *                    example: 'ADOGE@idir'
 *                  createdAt:
 *                    type: string
 *                    format: timestamp
 *                    description: The timestamp the form was created
 *                    example: 2023-06-04T02:46:50.983Z
 *                  updatedBy:
 *                    type: string
 *                    description: The username of the latest user that updated the form,
 *                    example: 'ADOGE@idir'
 *                  updatedAt:
 *                    type: string
 *                    format: timestamp
 *                    description: The timestamp the form was last updated
 *                    example: 2023-05-28T
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 */
routes.get('/', async (req, res, next) => {
  await controller.list(req, res, next);
});

routes.get('/:userId', async (req, res, next) => {
  await controller.read(req, res, next);
});

//
// User Form Preferences
//

/**
 * @openapi
 * admin/preferences/forms/{formId}:
 *  get:
 *    tags:
 *      - Users
 *    description: Get user preferences for a form
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
 *              type: object
 *              properties:
 *                formId:
 *                  type: string
 *                  description: ID of the form
 *                  format: uuid
 *                  example: c6455376-382c-439d-a811-0381a012d696
 *                userId:
 *                  type: string
 *                  format: uuid
 *                  description: ID of the User. This Id is from the User table in database.
 *                  required: true
 *                  example: 7cc11a0f-a7c9-4cbe-bd92-a2a22781ad9f
 *                preferences:
 *                  type: object
 *                  properties:
 *                    columns:
 *                      type: array
 *                      description: preference columns
 *                      example: ['fishermansName', 'email']
 *                createdBy:
 *                  type: string
 *                  description: The username of the user that created this form
 *                  example: 'ADOGE@idir'
 *                createdAt:
 *                  type: string
 *                  format: timestamp
 *                  description: The timestamp the form was created
 *                  example: 2023-06-04T02:46:50.983Z
 *                updatedBy:
 *                  type: string
 *                  description: The username of the latest user that updated the form,
 *                  example: 'ADOGE@idir'
 *                updatedAt:
 *                  type: string
 *                  format: timestamp
 *                  description: The timestamp the form was last updated
 *                  example: 2023-05-28T
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 */
routes.get('/preferences/forms/:formId', async (req, res, next) => {
  await controller.readUserFormPreferences(req, res, next);
});

/**
 * @openapi
 * admin/preferences/forms/{formId}:
 *  put:
 *    tags:
 *      - Users
 *    description: update user preferences for a form
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
 *              type: object
 *              properties:
 *                formId:
 *                  type: string
 *                  description: ID of the form
 *                  format: uuid
 *                  example: c6455376-382c-439d-a811-0381a012d696
 *                userId:
 *                  type: string
 *                  format: uuid
 *                  description: ID of the User. This Id is from the User table in database.
 *                  required: true
 *                  example: 7cc11a0f-a7c9-4cbe-bd92-a2a22781ad9f
 *                preferences:
 *                  type: object
 *                  properties:
 *                    columns:
 *                      type: array
 *                      description: preference columns
 *                      example: ['fishermansName', 'email']
 *                createdBy:
 *                  type: string
 *                  description: The username of the user that created this form
 *                  example: 'ADOGE@idir'
 *                createdAt:
 *                  type: string
 *                  format: timestamp
 *                  description: The timestamp the form was created
 *                  example: 2023-06-04T02:46:50.983Z
 *                updatedBy:
 *                  type: string
 *                  description: The username of the latest user that updated the form,
 *                  example: 'ADOGE@idir'
 *                updatedAt:
 *                  type: string
 *                  format: timestamp
 *                  description: The timestamp the form was last updated
 *                  example: 2023-05-28T
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 */
routes.put('/preferences/forms/:formId', async (req, res, next) => {
  await controller.updateUserFormPreferences(req, res, next);
});

routes.delete('/preferences/forms/:formId', async (req, res, next) => {
  await controller.deleteUserFormPreferences(req, res, next);
});

module.exports = routes;
