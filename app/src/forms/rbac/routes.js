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
 * rbac/current:
 *  get:
 *    tags:
 *      - RBAC
 *    description: Get User details and activities in CHEFS
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    responses:
 *      '200':
 *        description: Returns User details and all user activities in CHEFS
 *        content:
 *          application/json:
 *            examples:
 *              RBACCurrentEx:
 *                $ref: '#/components/examples/RBACCurrentEx'
 *            schema:
 *              type: object
 *              properties:
 *                id:
 *                  type: string
 *                  format: uuid
 *                  description: Database generated form Id
 *                usernameIdp:
 *                  type: string
 *                  description: User IDP username
 *                keycloakId:
 *                  type: string
 *                  description: Id from the keycloak
 *                idpUserId:
 *                  type: string
 *                  description: IDP id of the user. This is SSO team generated Id
 *                username:
 *                  type: string
 *                  description: User login username(can be either IDIR username, Basic BCeID (User Id), or Business BCeID (User Id))
 *                fullName:
 *                  type: string
 *                  description: User registered fullname.
 *                lastName:
 *                  type: string
 *                  description: User registered lastname.
 *                email:
 *                  type: string
 *                  description: User registered email on IDP login details (IDIR, Basic BCeID, or Business BCeID)
 *                idp:
 *                  type: string
 *                  description: Identity provider
 *                public:
 *                  type: boolean
 *                  description: Determines if the user is a public user
 *                forms:
 *                  type: array
 *                  description: List of forms created by the user
 *                  example: []
 */
routes.get('/current', keycloak.protect(), async (req, res, next) => {
  await controller.getCurrentUser(req, res, next);
});

/**
 * @openapi
 * rbac/current/submissions:
 *  get:
 *    tags:
 *      - RBAC
 *    description: Get User details and activities in CHEFS
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    responses:
 *      '200':
 *        description: Returns User details and all user activities in CHEFS
 *        content:
 *          application/json:
 *            examples:
 *              RBACCurrentEx:
 *                $ref: '#/components/examples/RBACCurrentEx'
 *            schema:
 *              type: object
 *              properties:
 *                formSubmissionId:
 *                  type: string
 *                  description: Form submission ID
 *                  format: uuid
 *                  example: 095f15a1-7d85-4919-8f40-5a0a3477cd7f
 *                userId:
 *                  type: string
 *                  format: uuid
 *                  description: ID of the User
 *                  required: true
 *                  example: 7cc11a0f-a7c9-4cbe-bd92-a2a22781ad9f
 *                permissions:
 *                  type: array
 *                  description: assigned permission to user on the form
 *                  example: ["submission_create"]
 *                formId:
 *                  type: string
 *                  description: Form ID
 *                  format: uuid
 *                version:
 *                  type: number
 *                  description: Form version
 *                  example: 2
 *                "id": "095f15a1-7d85-4919-8f40-5a0a3477cd7f"
 *                confirmationId:
 *                  type: string
 *                  description: Submission confirmation ID
 *                  example: 9100A7D1
 *                createdAt:
 *                  type: string
 *                  format: date-time
 *                  example: 2023-06-18T22:09:07.611Z
 *                updatedAt:
 *                  type: string
 *                  format: date-time
 *                  example: 2023-06-19T04:32:22.895Z
 *                draft:
 *                  type: boolean
 *                  description: This will be true if the submission is a draft
 *                  default: true
 *                  example: true
 *                deleted:
 *                  type: boolean
 *                  description: If set to true, the submission will be regarded as deleted
 *                  example: true
 *                name:
 *                  type: string
 *                  description: Name of the form
 *                  example: multiple_submission_file_download
 *                description:
 *                  type: string
 *                  description: Details about the form
 *                  example: Test Form
 *                active:
 *                  type: boolean
 *                  example: true,
 *                  description: This is used to determine if the form is deleted. A value of false means the form is deleted
 *                enableStatusUpdates:
 *                  type: boolean
 *                  example: true
 *                  description: Enables or disables form reviewers from updating this form status (i.e. Submitted, Assigned, Completed)
 *                enableSubmitterDraft:
 *                  type: boolean
 *                  example: true
 *                  description: Enables or disables form submitters from saving or editing this form draft
 *                submission:
 *                  type: object
 *                  description: submission detail
 *                  example: {}
 *                submissionStatus:
 *                  type: array
 *                  description: List of submission status
 *                  example: []
 */
routes.get('/current/submissions', keycloak.protect(), async (req, res, next) => {
  await controller.getCurrentUserSubmissions(req, res, next);
});

/**
 * @openapi
 * rbac/idps:
 *  get:
 *    tags:
 *      - RBAC
 *    description: Get User details and activities in CHEFS
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    responses:
 *      '200':
 *        description: Returns User details and all user activities in CHEFS
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  code:
 *                    type: string
 *                    description: identity provider code
 *                    example: bceid-basic
 *                  display:
 *                    type: string
 *                    description: idp display text
 *                    example: Basic BCeID,
 *                  active:
 *                    type: boolean
 *                    description: If the idp is active
 *                    example: true
 *                  idp:
 *                    type: string
 *                    description: The identity provider
 *                    example: bceid-basic
 *                  createdBy:
 *                    type: string
 *                    example: migration-022
 *                  createdAt:
 *                    type: string
 *                    format: date-time
 *                    example: 2023-03-29T14:07:46.684Z
 *                  updatedBy:
 *                    type: string
 *                    example: null
 *                  updatedAt:
 *                    type: string
 *                    format: date-time
 *                    example: 2023-03-29T14:07:46.684Z
 */
routes.get('/idps', async (req, res, next) => {
  await controller.getIdentityProviders(req, res, next);
});

/**
 * @openapi
 * rbac/forms:
 *  get:
 *    tags:
 *      - RBAC
 *    description: Get all user forms
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    responses:
 *      '200':
 *        description: Returns User details and all user activities in CHEFS
 *        content:
 *          application/json:
 *            examples:
 *              RBACUsersEx:
 *                $ref: '#/components/examples/RBACUsersEx'
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  userId:
 *                    type: string
 *                    description: ID of the User
 *                    format: uuid
 *                  idpUserId:
 *                    type: string
 *                    description: IDP id of the user. This is SSO team generated Id
 *                  username:
 *                    type: string
 *                    description: User login username(can be either IDIR username, Basic BCeID (User Id), or Business BCeID (User Id))
 *                  fullName:
 *                    type: string
 *                    description: User registered fullname.
 *                  lastName:
 *                    type: string
 *                    description: User registered lastname.
 *                  email:
 *                    type: string
 *                    description: User registered email on IDP login details (IDIR, Basic BCeID, or Business BCeID)
 *                  firstName:
 *                    type: string
 *                    description: User registered firstname
 *                  formId:
 *                    type: string
 *                    description: Form ID
 *                    format: uuid
 *                  formName:
 *                    type: string
 *                    description: Name or title of the form
 *                  labels:
 *                    type: string
 *                  identityProviders:
 *                    type: array
 *                    description: List of identity providers that can be used to login to the form
 *                  idps:
 *                    type: array
 *                    description: List of idps
 *                  active:
 *                    type: boolean
 *                    description: This is used to determine if the form is deleted. A value of false means the form is deleted
 *                  formVersionId:
 *                    type: string
 *                    description: Form version ID
 *                    format: uuid
 *                  version:
 *                    type: number
 *                    description: Form draft version to be published
 *                  roles:
 *                    type: array
 *                    description: assigned roles to user on the form
 *                  permissions:
 *                    type: array
 *                    description: assigned permission to user on the form
 *                  published:
 *                    type: string
 *                    description: publish status of the form
 *                  versionUpdatedAt:
 *                    type: string
 *                    format: date-time
 *                    description: date the form version was last updated
 *                  formDescription:
 *                    type: string
 *                    description: Form description
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
 * rbac/submissions:
 *  get:
 *    tags:
 *      - RBAC
 *    description: Get User details and activities in CHEFS
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
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
 *    responses:
 *      '200':
 *        description: Returns User details and all user activities in CHEFS
 *        content:
 *          application/json:
 *            examples:
 *              RBACFormSubmissionEx:
 *                $ref: '#/components/examples/RBACFormSubmissionEx'
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  formSubmissionId:
 *                    type: string
 *                    description: Form submission ID
 *                    format: uuid
 *                  userId:
 *                    type: string
 *                    format: uuid
 *                    description: ID of the User
 *                    required: true
 *                  permissions:
 *                    type: array
 *                    description: assigned permission to user on the form
 *                  formId:
 *                    type: string
 *                    description: Form ID
 *                    format: uuid
 *                  version:
 *                    type: number
 *                    description: Form version
 *                  id:
 *                    type: string
 *                  confirmationId:
 *                    type: string
 *                    description: Submission confirmation ID
 *                  createdAt:
 *                    type: string
 *                    format: date-time
 *                  updatedAt:
 *                    type: string
 *                    format: date-time
 *                  draft:
 *                    type: boolean
 *                    description: This will be true if the submission is a draft
 *                    default: true
 *                  deleted:
 *                    type: boolean
 *                    description: If set to true, the submission will be regarded as deleted
 *                  name:
 *                    type: string
 *                    description: Name of the form
 *                  description:
 *                    type: string
 *                    description: Details about the form
 *                  active:
 *                    type: boolean
 *                    description: This is used to determine if the form is deleted. A value of false means the form is deleted
 *                  enableStatusUpdates:
 *                    type: boolean
 *                    description: Enables or disables form reviewers from updating this form status (i.e. Submitted, Assigned, Completed)
 *                  enableSubmitterDraft:
 *                    type: boolean
 *                    description: Enables or disables form submitters from saving or editing this form draft
 *                  users:
 *                    type: object
 *                    description: user details
 */
routes.get('/submissions', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.getSubmissionUsers(req, res, next);
});

/**
 * @openapi
 * rbac/submissions:
 *  put:
 *    tags:
 *      - RBAC
 *    description: Get User details and activities in CHEFS
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formSubmissionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form submission ID.
 *        required: true
 *        example: 2d37713c-ae32-4c49-a73a-43ed9c7d1140
 *      - in: path
 *        name: userId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: User ID
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
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
 *            examples:
 *              RBACFormSubmissionEx:
 *                $ref: '#/components/examples/RBACFormSubmissionEx'
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  formSubmissionId:
 *                    type: string
 *                    description: Form submission ID
 *                    format: uuid
 *                  userId:
 *                    type: string
 *                    format: uuid
 *                    description: ID of the User
 *                    required: true
 *                  permissions:
 *                    type: array
 *                    description: assigned permission to user on the form
 *                  formId:
 *                    type: string
 *                    description: Form ID
 *                    format: uuid
 *                  version:
 *                    type: number
 *                    description: Form version
 *                  id:
 *                    type: string
 *                  confirmationId:
 *                    type: string
 *                    description: Submission confirmation ID
 *                  createdAt:
 *                    type: string
 *                    format: date-time
 *                  updatedAt:
 *                    type: string
 *                    format: date-time
 *                  draft:
 *                    type: boolean
 *                    description: This will be true if the submission is a draft
 *                    default: true
 *                  deleted:
 *                    type: boolean
 *                    description: If set to true, the submission will be regarded as deleted
 *                  name:
 *                    type: string
 *                    description: Name of the form
 *                  description:
 *                    type: string
 *                    description: Details about the form
 *                  active:
 *                    type: boolean
 *                    description: This is used to determine if the form is deleted. A value of false means the form is deleted
 *                  enableStatusUpdates:
 *                    type: boolean
 *                    description: Enables or disables form reviewers from updating this form status (i.e. Submitted, Assigned, Completed)
 *                  enableSubmitterDraft:
 *                    type: boolean
 *                    description: Enables or disables form submitters from saving or editing this form draft
 *                  users:
 *                    type: object
 *                    description: user details
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
 *    description: Get User details and activities in CHEFS
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    responses:
 *      '200':
 *        description: Returns User details and all user activities in CHEFS
 *        content:
 *          application/json:
 *            examples:
 *              RBACUsersEx:
 *                $ref: '#/components/examples/RBACUsersEx'
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  userId:
 *                    type: string
 *                    description: ID of the User
 *                    format: uuid
 *                  idpUserId:
 *                    type: string
 *                    description: IDP id of the user. This is SSO team generated Id
 *                  username:
 *                    type: string
 *                    description: User login username(can be either IDIR username, Basic BCeID (User Id), or Business BCeID (User Id))
 *                  fullName:
 *                    type: string
 *                    description: User registered fullname.
 *                  lastName:
 *                    type: string
 *                    description: User registered lastname.
 *                  email:
 *                    type: string
 *                    description: User registered email on IDP login details (IDIR, Basic BCeID, or Business BCeID)
 *                  firstName:
 *                    type: string
 *                    description: User registered firstname
 *                  formId:
 *                    type: string
 *                    description: Form ID
 *                    format: uuid
 *                  formName:
 *                    type: string
 *                    description: Name or title of the form
 *                  labels:
 *                    type: string
 *                  identityProviders:
 *                    type: array
 *                    description: List of identity providers that can be used to login to the form
 *                  idps:
 *                    type: array
 *                    description: List of idps
 *                  active:
 *                    type: boolean
 *                    description: This is used to determine if the form is deleted. A value of false means the form is deleted
 *                  formVersionId:
 *                    type: string
 *                    description: Form version ID
 *                    format: uuid
 *                  version:
 *                    type: number
 *                    description: Form draft version to be published
 *                  roles:
 *                    type: array
 *                    description: assigned roles to user on the form
 *                  permissions:
 *                    type: array
 *                    description: assigned permission to user on the form
 *                  published:
 *                    type: string
 *                    description: publish status of the form
 *                  versionUpdatedAt:
 *                    type: string
 *                    format: date-time
 *                    description: date the form version was last updated
 *                  formDescription:
 *                    type: string
 *                    description: Form description
 */
routes.get('/users', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.getUserForms(req, res, next);
});

/**
 * @openapi
 * rbac/users:
 *  get:
 *    tags:
 *      - RBAC
 *    description: Get User details and activities in CHEFS
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
 *        description: Returns User details and all user activities in CHEFS
 *        content:
 *          application/json:
 *            examples:
 *              RBACUsersEx:
 *                $ref: '#/components/examples/RBACUsersEx'
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  userId:
 *                    type: string
 *                    description: ID of the User
 *                    format: uuid
 *                  idpUserId:
 *                    type: string
 *                    description: IDP id of the user. This is SSO team generated Id
 *                  username:
 *                    type: string
 *                    description: User login username(can be either IDIR username, Basic BCeID (User Id), or Business BCeID (User Id))
 *                  fullName:
 *                    type: string
 *                    description: User registered fullname.
 *                  lastName:
 *                    type: string
 *                    description: User registered lastname.
 *                  email:
 *                    type: string
 *                    description: User registered email on IDP login details (IDIR, Basic BCeID, or Business BCeID)
 *                  firstName:
 *                    type: string
 *                    description: User registered firstname
 *                  formId:
 *                    type: string
 *                    description: Form ID
 *                    format: uuid
 *                  formName:
 *                    type: string
 *                    description: Name or title of the form
 *                  labels:
 *                    type: string
 *                  identityProviders:
 *                    type: array
 *                    description: List of identity providers that can be used to login to the form
 *                  idps:
 *                    type: array
 *                    description: List of idps
 *                  active:
 *                    type: boolean
 *                    description: This is used to determine if the form is deleted. A value of false means the form is deleted
 *                  formVersionId:
 *                    type: string
 *                    description: Form version ID
 *                    format: uuid
 *                  version:
 *                    type: number
 *                    description: Form draft version to be published
 *                  roles:
 *                    type: array
 *                    description: assigned roles to user on the form
 *                  permissions:
 *                    type: array
 *                    description: assigned permission to user on the form
 *                  published:
 *                    type: string
 *                    description: publish status of the form
 *                  versionUpdatedAt:
 *                    type: string
 *                    format: date-time
 *                    description: date the form version was last updated
 *                  formDescription:
 *                    type: string
 *                    description: Form description
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
 *    description: Get User details and activities in CHEFS
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
 */
routes.delete('/users', hasFormPermissions(P.TEAM_UPDATE), hasFormRoles([R.OWNER, R.TEAM_MANAGER]), hasRolePermissions(true), async (req, res, next) => {
  await controller.removeMultiUsers(req, res, next);
});

module.exports = routes;
