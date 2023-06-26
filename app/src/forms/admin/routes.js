const config = require('config');
const routes = require('express').Router();

const currentUser = require('../auth/middleware/userAccess').currentUser;

const controller = require('./controller');
const userController = require('../user/controller');
const keycloak = require('../../components/keycloak');

// Always have this applied to all routes here
routes.use(keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`));
routes.use(currentUser);

// Routes under the /admin pathing will fetch data without doing Form permission checks in the database
// As such, this should ALWAYS remain under the :admin role check and that KC role should not be given out
// other than to people who have permission to read all data

//
// Forms
//

/**
 * @openapi
 * /admin/forms:
 *  get:
 *    tags:
 *      - Admin
 *    description: This endpoint will fetch all forms under the admin access.
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
 *              $ref: '#/components/responses/responseBody/AdminsFormGetEx'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 *      '404':
 *        $ref: '#/components/responses/ResourceNotFound'
 */
routes.get('/forms', async (req, res, next) => {
  await controller.listForms(req, res, next);
});

/**
 * @openapi
 * /admin/forms/{formId}:
 *  get:
 *    tags:
 *      - Admin
 *    description: This endpoint will fetch the form details(and metadata for versions).
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/AdminReadFormEx'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.get('/forms/:formId', async (req, res, next) => {
  await controller.readForm(req, res, next);
});

/**
 * @openapi
 * /admin/forms/{formId}/apiKey:
 *  delete:
 *    tags:
 *      - Admin
 *    description: This endpoint will delete the form API key.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.delete('/forms/:formId/apiKey', async (req, res, next) => {
  await controller.deleteApiKey(req, res, next);
});

/**
 * @openapi
 * /admin/forms/{formId}/apiKey:
 *  get:
 *    tags:
 *      - Admin
 *    description: This endpoint will fetch the API key details for this form.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/AdminReadAPIKeyDetails'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.get('/forms/:formId/apiKey', async (req, res, next) => {
  await controller.readApiDetails(req, res, next);
});

/**
 * @openapi
 * /admin/forms/{formId}/restore:
 *  put:
 *    tags:
 *      - Admin
 *    description: This endpoint will restore deleted form.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/AdminRestoreForm'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.put('/forms/:formId/restore', async (req, res, next) => {
  await controller.restoreForm(req, res, next);
});

routes.get('/forms/:formId/versions/:formVersionId', async (req, res, next) => {
  await controller.readVersion(req, res, next);
});

/**
 * @openapi
 * /admin/forms/{formId}/formUsers:
 *  get:
 *    tags:
 *      - Admin
 *    description: This endpoint will fetch all the users added as team members to this form and their roles/permissions.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/AdminGetFormUserRoles'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 * */
routes.get('/forms/:formId/formUsers', async (req, res, next) => {
  await controller.getFormUserRoles(req, res, next);
});

/**
 * @openapi
 * /admin/forms/{formId}/addUser:
 *  put:
 *   tags:
 *    - Admin
 *   description: This endpoint will fetch all the users added as team members to this form and their roles/permissions.
 *   security:
 *    - bearerAuth: []
 *    - basicAuth: []
 *    - openId: []
 *   parameters:
 *    - in: path
 *      name: formId
 *      schema:
 *       type: string
 *       format: uuid
 *      description: ID of the form.
 *      required: true
 *      example: c6455376-382c-439d-a811-0381a012d696
 *    - in: query
 *      name: formId
 *      schema:
 *       type: string
 *       format: uuid
 *      description: ID of the form.
 *      required: true
 *      example: c6455376-382c-439d-a811-0381a012d696
 *    - in: query
 *      name: userId
 *      schema:
 *       type: string
 *       format: uuid
 *      description: ID of the User.
 *      required: true
 *      example: 7cc11a0f-a7c9-4cbe-bd92-a2a22781ad9f
 *   requestBody:
 *    required: true
 *    content:
 *      application/json:
 *        schema:
 *          type: object
 *          properties:
 *            formId:
 *              type: string
 *              description: ID of the form
 *              format: uuid
 *              example: c6455376-382c-439d-a811-0381a012d696
 *            userId:
 *              type: string
 *              format: uuid
 *              description: ID of the User. This Id is from the User table in database.
 *              required: true
 *              example: 7cc11a0f-a7c9-4cbe-bd92-a2a22781ad9f
 *            role:
 *              type: string
 *              description: Value must be 'owner'
 *              default: owner
 *              required: true
 *              example: owner
 *   responses:
 *    '200':
 *      description: Success
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/responses/responseBody/AdminSetFormUserRoles'
 *    '403':
 *      $ref: '#/components/responses/Forbidden'
 *    '401':
 *      $ref: '#/components/responses/NoFormAccess'
 *    '422':
 *      description: 'Unprocessable Entity'
 *      content:
 *        application/json:
 *          schema:
 *            oneOf:
 *              - $ref: '#/components/schemas/UnprocessableEntityDBError'
 *              - $ref: '#/components/schemas/RoleRequiredValidationError'
 *              - $ref: '#/components/schemas/UserAndFormIdequiredError'
 */
routes.put('/forms/:formId/addUser', async (req, res, next) => {
  await controller.setFormUserRoles(req, res, next);
});

//
// Users
//

/**
 * @openapi
 * /admin/users:
 *  get:
 *   tags:
 *    - Admin
 *   description: This endpoint will fetch all the users.
 *   security:
 *    - bearerAuth: []
 *    - basicAuth: []
 *    - openId: []
 *   responses:
 *    '200':
 *      description: Success
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/responses/responseBody/AdminGetUsers'
 *    '403':
 *      $ref: '#/components/responses/Forbidden'
 */
routes.get('/users', async (req, res, next) => {
  await controller.getUsers(req, res, next);
});

/**
 * @openapi
 * /admin/users/{userId}:
 *  get:
 *    tags:
 *      - Admin
 *    description: This endpoint will fetch a single user using the userId passed through the endpoint path.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/AdminReadUser'
 *    '403':
 *      $ref: '#/components/responses/Forbidden'
 *    '404':
 *      $ref: '#/components/responses/ResourceNotFound'
 */
routes.get('/users/:userId', async (req, res, next) => {
  await userController.read(req, res, next);
});

//
//Form componets help info
//

/**
 * @openapi
 * /admin/formcomponents/proactivehelp/object:
 *  post:
 *   tags:
 *    - Admin
 *   description: This endpoint will create or update proactive help details form.io component
 *   security:
 *    - bearerAuth: []
 *    - basicAuth: []
 *    - openId: []
 *   requestBody:
 *    required: true
 *    content:
 *      application/json:
 *        schema:
 *          $ref: '#/components/requestBodies/AdminReqProactiveHelpObject'
 *   responses:
 *    '200':
 *      description: Success
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/responses/responseBody/AdminGetProactiveHelpObject'
 *    '403':
 *      $ref: '#/components/responses/Forbidden'
 *    '422':
 *      $ref: '#/components/responses/UnprocessableEntityDB'
 */
routes.post('/formcomponents/proactivehelp/object', async (req, res, next) => {
  await controller.createFormComponentsProactiveHelp(req, res, next);
});

/**
 * @openapi
 * /admin/formcomponents/proactivehelp/{publishStatus}/{componentId}:
 *  put:
 *   tags:
 *    - Admin
 *   description: This endpoint will update form.io component proactive help publish status.
 *   security:
 *    - bearerAuth: []
 *    - basicAuth: []
 *    - openId: []
 *   parameters:
 *      - in: path
 *        name: publishStatus
 *        schema:
 *          type: boolean
 *        description: Publish status of the Firm.io component.
 *        required: true
 *        example: true
 *      - in: path
 *        name: componentId
 *        schema:
 *          type: string
 *        description: Id of the Form.io component.
 *        required: true
 *        example: true
 *   responses:
 *    '200':
 *      description: Success
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/responses/responseBody/AdminProactiveHelpPublishStatus'
 *    '403':
 *      $ref: '#/components/responses/Forbidden'
 *    '422':
 *      $ref: '#/components/responses/UnprocessableEntityDB'
 */
routes.put('/formcomponents/proactivehelp/:publishStatus/:componentId', async (req, res, next) => {
  await controller.updateFormComponentsProactiveHelp(req, res, next);
});

/**
 * @openapi
 * /admin/formcomponents/proactivehelp/imageUrl/{componentId}:
 *  get:
 *   tags:
 *    - Admin
 *   description: This endpoint will get the image of the form.io component proactive help.
 *   security:
 *    - bearerAuth: []
 *    - basicAuth: []
 *    - openId: []
 *   parameters:
 *    - in: path
 *      name: componentId
 *      schema:
 *        type: string
 *      description: Id of the Form.io component.
 *      required: true
 *      example: true
 *   responses:
 *    '200':
 *      description: Success
 *      content:
 *        image/png:
 *          schema:
 *            type: object
 *            properties:
 *              url:
 *                type: string
 *                format: binary
 *    '403':
 *      $ref: '#/components/responses/Forbidden'
 *    '422':
 *      $ref: '#/components/responses/UnprocessableEntityDB'
 */
routes.get('/formcomponents/proactivehelp/imageUrl/:componentId', async (req, res, next) => {
  await controller.getFCProactiveHelpImageUrl(req, res, next);
});

/**
 * @openapi
 * /admin/formcomponents/proactivehelp/list:
 *  get:
 *   tags:
 *    - Admin
 *   description: This endpoint will fetch the list of all the proactive help details.
 *   security:
 *    - bearerAuth: []
 *    - basicAuth: []
 *    - openId: []
 *   responses:
 *    '200':
 *      description: Success
 *      content:
 *        application/json:
 *          schema:
 *           $ref: '#/components/responses/responseBody/AdminProactiveHelpList'
 *    '403':
 *      $ref: '#/components/responses/Forbidden'
 */
routes.get('/formcomponents/proactivehelp/list', async (req, res, next) => {
  await controller.listFormComponentsProactiveHelp(req, res, next);
});

module.exports = routes;
