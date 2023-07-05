const config = require('config');
const routes = require('express').Router();

const controller = require('./controller');
const keycloak = require('../../components/keycloak');
const P = require('../common/constants').Permissions;
const R = require('../common/constants').Roles;
const { currentUser, hasFormPermissions, hasSubmissionPermissions, hasFormRoles, hasRolePermissions } = require('../auth/middleware/userAccess');

routes.use(currentUser);

/**
 * @openapi
 * /rbac/current:
 *  get:
 *    tags:
 *      - RBAC
 *    description: This endpoint will get list of users and roles for a form
 *    security:
 *      - bearerAuth: []
 *      - openId: []
 *    responses:
 *      '200':
 *        description: Sucess
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/RBACGetCurrentUser'
 *      '403':
 *        $ref: '#/components/responses/Error/AccessDenied'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */

routes.get('/current', keycloak.protect(), async (req, res, next) => {
  await controller.getCurrentUser(req, res, next);
});

/**
 * @openapi
 * /rbac/current/submissions:
 *  get:
 *    tags:
 *      - RBAC
 *    description: ⁠This endpoint will fetch all the submissions in chefs for the current user. This list also includes each submission's user permissions, roles, and submission status.
 *    security:
 *      - bearerAuth: []
 *      - openId: []
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *           schema:
 *               $ref: '#/components/responses/responseBody/RBACGetCurrentUserSubmissions'
 *      '403':
 *        $ref: '#/components/responses/Error/AccessDenied'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/current/submissions', keycloak.protect(), async (req, res, next) => {
  await controller.getCurrentUserSubmissions(req, res, next);
});

/**
 * @openapi
 * /rbac/idps:
 *  get:
 *    tags:
 *      - RBAC
 *    description: This endpoint will get list of a list of identity providers.
 *    security:
 *      - bearerAuth: []
 *      - openId: []
 *    responses:
 *      '200':
 *        description: Sucess
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/RBACGetIdentityProviders'
 *      '403':
 *        $ref: '#/components/responses/Error/AccessDenied'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/idps', async (req, res, next) => {
  await controller.getIdentityProviders(req, res, next);
});

/**
 * @openapi
 * /rbac/forms:
 *  get:
 *    tags:
 *      - RBAC
 *    description: This endpoint will fetch a list of users and roles for a form.
 *    security:
 *      - bearerAuth: []
 *      - openId: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/FormReqCreateDraft'
 *    parameters:
 *      - in: query
 *        name: formSubmissionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form submission.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: query
 *        name: userId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the user.
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: query
 *        name: idpUserId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: User ID of the IDP.
 *        example: ao9rsqw60nvf24pemkdik5e3fmo2kb6l
 *      - in: query
 *        name: username
 *        schema:
 *          type: string
 *        description: IDP registered user username.
 *        example: ajudge
 *      - in: query
 *        name: fullName
 *        schema:
 *          type: string
 *        description: IDP registered user fullName.
 *        example: Ash Judge
 *      - in: query
 *        name: firstName
 *        schema:
 *          type: string
 *        description: IDP registered user firstName.
 *        example: Ash
 *      - in: query
 *        name: lastName
 *        schema:
 *          type: string
 *        description: IDP registered user lastName.
 *        example: Judge
 *      - in: query
 *        name: email
 *        schema:
 *          type: string
 *          format: email
 *        description: IDP registered user email.
 *        example: ashjudge@gov.bc.ca
 *      - in: query
 *        name: formName
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Name of the form
 *        example: BC Forms
 *      - in: query
 *        name: active
 *        schema:
 *          type: boolean
 *        description: Active form. The form has yet to be soft deleted.
 *        example: true
 *      - in: query
 *        name: idps
 *        schema:
 *          type: string
 *        description: List of IDPs for form access.
 *        example: idir
 *      - in: query
 *        name: roles
 *        schema:
 *          type: string
 *        description: Role code assigned to the current user on the form.
 *        example: form_designer
 *      - in: query
 *        name: permissions
 *        schema:
 *          type: string
 *        description: Permission code assigned to the current user on the form
 *        example: design_create
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            examples:
 *              RBACUsersEx:
 *                $ref: '#/components/examples/RBACUsersEx'
 *            schema:
 *              $ref: '#/components/responses/responseBody/RBACGetFormUsers'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/FormIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *      '403':
 *        $ref: '#/components/responses/Error/AccessDenied'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/forms', hasFormPermissions(P.TEAM_READ), async (req, res, next) => {
  await controller.getFormUsers(req, res, next);
});

/*
possible clean up
*/
routes.put('/forms', hasFormPermissions(P.TEAM_UPDATE), async (req, res, next) => {
  await controller.setFormUsers(req, res, next);
});

/**
 * @openapi
 * /rbac/submissions:
 *  get:
 *    tags:
 *      - RBAC
 *    description: This endpoint will fetch a list of users and the user permissions on each form submission.
 *    security:
 *      - bearerAuth: []
 *      - openId: []
 *    parameters:
 *      - in: query
 *        name: formSubmissionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form submission ID.
 *        required: true
 *        example: 2d37713c-ae32-4c49-a73a-43ed9c7d1140
 *      - in: query
 *        name: userId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the user.
 *        example: 7dad1ec9-d3c0-4b0f-8ead-cb4d9fa98987
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *           schema:
 *              $ref: '#/components/responses/responseBody/RBACFormSubmission'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/SubmissionIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/SubmissionAccessError'
 *      '403':
 *        $ref: '#/components/responses/Error/AccessDenied'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 *      '404':
 *        $ref: '#/components/responses/Error/ResourceNotFound'
 */
routes.get('/submissions', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.getSubmissionUsers(req, res, next);
});

/**
 * @openapi
 * /rbac/submissions:
 *  put:
 *    tags:
 *      - RBAC
 *    description: This endpoint will add users as team members to draft submission
 *    security:
 *      - bearerAuth: []
 *      - openId: []
 *    parameters:
 *      - in: query
 *        name: formSubmissionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form submission ID.
 *        required: true
 *        example: 2d37713c-ae32-4c49-a73a-43ed9c7d1140
 *      - in: query
 *        name: userId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: User ID
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: query
 *        name: selectedUserEmail
 *        schema:
 *          type: string
 *          format: email
 *        description: Email address of the user to add to the specified submission team
 *        required: true
 *        example: testa@gmail.com
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              permissions:
 *                type: array
 *                description: List of form submission permissions assigned to user
 *                example: ["submission_update", "submission_read"]
 *    responses:
 *      '200':
 *        description: Returns User details and all user activities in CHEFS
 *        content:
 *          application/json:
 *           schema:
 *              $ref: '#/components/responses/responseBody/RBACsetSubmissionUserPermissions'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/SubmissionIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/SubmissionAccessError'
 *      '403':
 *        $ref: '#/components/responses/Error/AccessDenied'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 *      '404':
 *        $ref: '#/components/responses/Error/ResourceNotFound'
 */
routes.put('/submissions', hasSubmissionPermissions(P.SUBMISSION_UPDATE), async (req, res, next) => {
  await controller.setSubmissionUserPermissions(req, res, next);
});

/**
 * @openapi
 * rbac/users:
 *  get:
 *    tags:
 *      - RBAC
 *    description: This endpoint will fetch list of forms for a user and the user's roles for each form.
 *    security:
 *      - bearerAuth: []
 *      - openId: []
 *    parameters:
 *      - in: query
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: query
 *        name: userId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the user.
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: query
 *        name: idpUserId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: User ID of the IDP.
 *        example: ao9rsqw60nvf24pemkdik5e3fmo2kb6l
 *      - in: query
 *        name: username
 *        schema:
 *          type: string
 *        description: IDP registered user username.
 *        example: ajudge
 *      - in: query
 *        name: fullName
 *        schema:
 *          type: string
 *        description: IDP registered user fullName.
 *        example: Ash Judge
 *      - in: query
 *        name: firstName
 *        schema:
 *          type: string
 *        description: IDP registered user firstName.
 *        example: Ash
 *      - in: query
 *        name: lastName
 *        schema:
 *          type: string
 *        description: IDP registered user lastName.
 *        example: Judge
 *      - in: query
 *        name: email
 *        schema:
 *          type: string
 *          format: email
 *        description: IDP registered user email.
 *        example: ashjudge@gov.bc.ca
 *      - in: query
 *        name: formName
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Name of the form
 *        example: BC Forms
 *      - in: query
 *        name: active
 *        schema:
 *          type: boolean
 *        description: Active form. The form has yet to be soft deleted.
 *        example: true
 *      - in: query
 *        name: idps
 *        schema:
 *          type: string
 *        description: List of IDPs for form access.
 *        example: idir
 *      - in: query
 *        name: roles
 *        schema:
 *          type: string
 *        description: Role code assigned to the current user on the form.
 *        example: form_designer
 *      - in: query
 *        name: permissions
 *        schema:
 *          type: string
 *        description: Permission code assigned to the current user on the form
 *        example: design_create
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/RBACGetUsersForms'
 *      '403':
 *        $ref: '#/components/responses/Error/AccessDenied'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/users', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.getUserForms(req, res, next);
});

/**
 * @openapi
 * rbac/users:
 *  put:
 *    tags:
 *      - RBAC
 *    description: This endpoint will set form roles for a user
 *    security:
 *      - bearerAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: userId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: User ID
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    requestBody:
 *      required: true
 *      description: OK
 *      content:
 *        application/json:
 *          schema:
 *            type: array
 *            items:
 *              type: object
 *              properties:
 *                formId:
 *                  type: string
 *                  description: Form ID
 *                  format: uuid
 *                  example: e37705ee-1c01-44eb-ae8a-e7d96002ae67
 *                role:
 *                  type: string
 *                  description: Assigned role to user on the form
 *                  example: owner
 *                userId:
 *                  type: string
 *                  description: ID of the User
 *                  format: uuid
 *                  example: 2a4770b7-6f0e-4629-a359-bf820295f23a
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/RBACSetUsersForms'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/FormIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *      '403':
 *        $ref: '#/components/responses/Error/AccessDenied'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.put('/users', hasFormPermissions(P.TEAM_UPDATE), hasFormRoles([R.OWNER, R.TEAM_MANAGER]), hasRolePermissions(false), async (req, res, next) => {
  await controller.setUserForms(req, res, next);
});

/**
 * @openapi
 * rbac/users:
 *  delete:
 *    tags:
 *      - RBAC
 *    description: This endpoint will remove multiple users from a form.
 *    security:
 *      - bearerAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: array
 *            example: ["7cc11a0f-a7c9-4cbe-bd92-a3a22781ac8c", "3ddb68cb-b936-49fe-9ba4-48b04859eaf7" ]
 *    responses:
 *      '200':
 *        description: Sucess
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/FormIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *      '403':
 *        $ref: '#/components/responses/Error/AccessDenied'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.delete('/users', hasFormPermissions(P.TEAM_UPDATE), hasFormRoles([R.OWNER, R.TEAM_MANAGER]), hasRolePermissions(true), async (req, res, next) => {
  await controller.removeMultiUsers(req, res, next);
});

module.exports = routes;
